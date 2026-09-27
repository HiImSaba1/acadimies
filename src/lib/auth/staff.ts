import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hash } from "argon2";
import type { StaffRole } from "@/db/schema";
import { matchesEnvironmentOwner, readAdminEnvironment } from "./environment";

export type ActiveStaffIdentity = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: StaffRole;
  passwordHash: string | null;
};

export async function findActiveStaffByUsername(
  input: string,
): Promise<ActiveStaffIdentity | null> {
  const username = input.trim().toLocaleLowerCase("en-US");
  const [{ db }, { users }] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
  ]);
  const [staff] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.displayName,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.username, username), eq(users.isActive, true)))
    .limit(1);

  return staff ?? null;
}

export async function findActiveStaffByEmail(input: string): Promise<ActiveStaffIdentity | null> {
  const email = input.trim().toLocaleLowerCase("en-US");
  const [{ db }, { users }] = await Promise.all([import("@/db"), import("@/db/schema")]);
  const [staff] = await db.select({
    id: users.id, username: users.username, email: users.email, name: users.displayName,
    role: users.role, passwordHash: users.passwordHash,
  }).from(users).where(and(eq(users.email, email), eq(users.isActive, true))).limit(1);
  return staff ?? null;
}

export async function bootstrapEnvironmentOwner(
  usernameInput: string,
  passwordInput: string,
): Promise<ActiveStaffIdentity | null> {
  const environment = readAdminEnvironment();
  const username = usernameInput.trim().toLocaleLowerCase("en-US");
  if (!matchesEnvironmentOwner(username, passwordInput, environment)) return null;

  const [{ db }, { users }] = await Promise.all([import("@/db"), import("@/db/schema")]);
  const passwordHash = await hash(environment.ADMIN_PASSWORD);
  const id = randomUUID();
  await db.insert(users).values({
    id,
    username,
    email: environment.ADMIN_EMAIL?.toLocaleLowerCase("en-US") ?? null,
    displayName: "Acadimies Owner",
    role: "owner",
    passwordHash,
    isActive: true,
  }).onDuplicateKeyUpdate({
    set: {
      username,
      email: environment.ADMIN_EMAIL?.toLocaleLowerCase("en-US") ?? null,
      displayName: "Acadimies Owner",
      passwordHash,
      role: "owner",
      isActive: true,
    },
  });
  return findActiveStaffByUsername(username);
}
