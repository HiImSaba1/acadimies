import { z } from "zod";

const adminEnvironmentSchema = z.object({
  ADMIN_USERNAME: z.string().trim().min(3).max(191),
  ADMIN_PASSWORD: z.string().min(12).max(1024),
  ADMIN_EMAIL: z.string().trim().email().max(191).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
}).refine((value) => value.NEXTAUTH_SECRET || value.ADMIN_SESSION_SECRET, {
  message: "NEXTAUTH_SECRET or ADMIN_SESSION_SECRET must contain at least 32 characters.",
});

export type AdminEnvironment = z.infer<typeof adminEnvironmentSchema>;

export function readAdminEnvironment(
  environment: Record<string, string | undefined> = process.env,
): AdminEnvironment {
  return adminEnvironmentSchema.parse(environment);
}

export function authSecret(environment: Record<string, string | undefined> = process.env) {
  return environment.NEXTAUTH_SECRET ?? environment.ADMIN_SESSION_SECRET;
}

export function matchesEnvironmentOwner(
  username: string,
  password: string,
  environment: AdminEnvironment,
): boolean {
  return username.trim().toLocaleLowerCase("en-US") === environment.ADMIN_USERNAME.toLocaleLowerCase("en-US")
    && password === environment.ADMIN_PASSWORD;
}
