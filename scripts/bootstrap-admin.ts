import "dotenv/config";

import { randomUUID } from "node:crypto";
import { hash, verify } from "argon2";
import { eq } from "drizzle-orm";
import { readAdminEnvironment } from "../src/lib/auth/environment";

async function bootstrap() {
  const environment = readAdminEnvironment();
  const username = environment.ADMIN_USERNAME.trim().toLocaleLowerCase("en-US");
  const email = environment.ADMIN_EMAIL?.trim().toLocaleLowerCase("en-US") ?? null;
  const passwordHash = await hash(environment.ADMIN_PASSWORD);
  const [{ db, pool }, { users }] = await Promise.all([
    import("../src/db"),
    import("../src/db/schema"),
  ]);

  try {
    await db.insert(users).values({
      id: randomUUID(),
      username,
      email,
      displayName: "Acadimies Owner",
      role: "owner",
      passwordHash,
      isActive: true,
    }).onDuplicateKeyUpdate({
      set: {
        username,
        email,
        displayName: "Acadimies Owner",
        role: "owner",
        passwordHash,
        isActive: true,
      },
    });

    const [owner] = await db.select({
      role: users.role,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
    }).from(users).where(eq(users.username, username)).limit(1);
    const passwordVerified = owner?.passwordHash
      ? await verify(owner.passwordHash, environment.ADMIN_PASSWORD)
      : false;

    if (!owner || owner.role !== "owner" || !owner.isActive || !passwordVerified) {
      throw new Error("OWNER_VERIFICATION_FAILED");
    }

    console.log(JSON.stringify({
      ownerPersisted: true,
      role: "owner",
      active: true,
      passwordHashVerified: true,
      loginIdentifier: "username",
      credentialValuesPrinted: false,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

bootstrap().catch((error) => {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  const code = cause && typeof cause === "object" && "code" in cause
    ? String(cause.code)
    : "ADMIN_BOOTSTRAP_FAILED";
  const safeReason = {
    ECONNREFUSED: "database-unreachable",
    ER_ACCESS_DENIED_ERROR: "database-authentication",
    ER_BAD_DB_ERROR: "database-missing",
    ER_NO_SUCH_TABLE: "users-table-missing",
    ER_BAD_FIELD_ERROR: "users-schema-outdated",
    OWNER_VERIFICATION_FAILED: "owner-verification-failed",
  }[code] ?? "admin-bootstrap-failed";
  console.error(`Admin bootstrap failed: ${safeReason}. No credential values were printed.`);
  process.exitCode = 1;
});
