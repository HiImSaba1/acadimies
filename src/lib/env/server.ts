import { z } from "zod";

const normalizeEnvironmentToken = (value: string) => value
  .trim()
  .normalize("NFKC")
  .replace(/[\u200B-\u200D\uFEFF]/g, "");

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith("mysql://") || value.startsWith("mysql2://"),
      "DATABASE_URL must be a MySQL connection URL",
    )
    .refine(
      (value) => {
        try {
          return new URL(value).pathname.replace(/^\//, "") === "next_acadimies";
        } catch {
          return false;
        }
      },
      "DATABASE_URL must target the next_acadimies database",
    ).optional(),
  DB_HOST: z.string().trim().min(1).optional(),
  DB_PORT: z.coerce.number().int().positive().max(65535).optional(),
  DB_NAME: z.string().transform(normalizeEnvironmentToken).optional(),
  DB_USER: z.string().trim().min(1).optional(),
  DB_PASSWORD: z.string().optional(),
}).transform((value, context) => {
  if (value.DATABASE_URL) return { DATABASE_URL: value.DATABASE_URL };
  if (value.DB_NAME && value.DB_NAME !== "next_acadimies") {
    context.addIssue({
      code: "custom",
      path: ["DB_NAME"],
      message: "DB_NAME must target the next_acadimies database",
    });
    return z.NEVER;
  }
  if (!value.DB_HOST || !value.DB_NAME || !value.DB_USER) {
    context.addIssue({ code: "custom", message: "Configure DATABASE_URL or the DB_HOST/DB_NAME/DB_USER fields." });
    return z.NEVER;
  }
  const user = encodeURIComponent(value.DB_USER);
  const password = encodeURIComponent(value.DB_PASSWORD ?? "");
  const authentication = password ? `${user}:${password}` : user;
  return { DATABASE_URL: `mysql://${authentication}@${value.DB_HOST}:${value.DB_PORT ?? 3306}/${value.DB_NAME}` };
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}
