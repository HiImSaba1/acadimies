import "dotenv/config";
import { verify } from "argon2";
import type { RowDataPacket } from "mysql2";
import { readAdminEnvironment } from "../src/lib/auth/environment";
import { readServerEnvironment } from "../src/lib/env/server";

function databaseName(url: string) {
  return new URL(url).pathname.replace(/^\//, "");
}

type ColumnRow = RowDataPacket & { COLUMN_NAME: string };
type TableRow = RowDataPacket & { TABLE_NAME: string };
type OwnerRow = RowDataPacket & { password_hash: string | null };

const editorialTables = [
  "posts",
  "categories",
  "post_categories",
  "tags",
  "post_tags",
  "post_revisions",
  "media_assets",
  "post_daily_views",
] as const;

async function inspect() {
  const admin = readAdminEnvironment();
  const database = readServerEnvironment();
  const { pool } = await import("../src/db");
  try {
    const [columnRows] = await pool.query<ColumnRow[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [databaseName(database.DATABASE_URL)],
    );
    const columns = new Set(columnRows.map((row) => row.COLUMN_NAME));
    const schemaReady = ["username", "email", "password_hash", "role", "is_active"]
      .every((column) => columns.has(column));
    const [tableRows] = await pool.query<TableRow[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)",
      [databaseName(database.DATABASE_URL), editorialTables],
    );
    const availableTables = new Set(tableRows.map((row) => row.TABLE_NAME));
    const missingEditorialTables = editorialTables.filter((table) => !availableTables.has(table));
    const editorialSchemaReady = missingEditorialTables.length === 0;
    const [ownerRows] = schemaReady
      ? await pool.query<OwnerRow[]>(
          "SELECT password_hash FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1 LIMIT 1",
          [admin.ADMIN_USERNAME],
        )
      : [[] as OwnerRow[]];
    const owner = ownerRows[0];
    const storedPasswordMatchesEnvironment = owner?.password_hash
      ? await verify(owner.password_hash, admin.ADMIN_PASSWORD)
      : false;

    console.log(JSON.stringify({
      authentication: {
        credentialsConfigured: true,
        loginIdentifier: "username",
        usernameConfigured: admin.ADMIN_USERNAME.length > 0,
        recoveryEmailConfigured: Boolean(admin.ADMIN_EMAIL),
        emailAcceptedForPasswordLogin: false,
        passwordPolicy: "PASS (12+ characters)",
        sessionSecretPolicy: "PASS (32+ characters)",
        plaintextCredentialPrinted: false,
      },
      database: {
        configured: true,
        driver: "mysql",
        database: databaseName(database.DATABASE_URL),
        connectionAttempted: true,
        connectionSucceeded: true,
        usersSchemaReady: schemaReady,
        editorialSchemaReady,
        editorialTables: [...editorialTables],
        missingEditorialTables,
        environmentOwnerPersisted: Boolean(owner),
        storedPasswordMatchesEnvironment,
        migrationAttempted: false,
      },
      authorization: {
        protectedRoute: "/admin",
        bootstrapRole: "owner",
        databaseBootstrap: "first valid environment-owner login",
        persistedPasswordFormat: "argon2 hash",
        passwordRecoveryDeliveryImplemented: false,
      },
    }, null, 2));
    if (!schemaReady || !editorialSchemaReady || !owner || !storedPasswordMatchesEnvironment) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

function diagnosticFields(error: unknown): string[] {
  if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
    const issues: unknown[] = error.issues;
    return issues.map((issue: unknown) => issue && typeof issue === "object" && "path" in issue && Array.isArray(issue.path)
      ? issue.path.map(String).join(".") || "configuration"
      : "configuration");
  }
  if (error && typeof error === "object" && "code" in error) {
    return [{
      ECONNREFUSED: "database-unreachable",
      ER_ACCESS_DENIED_ERROR: "database-authentication",
      ER_BAD_DB_ERROR: "database-missing",
      ER_NO_SUCH_TABLE: "users-table-missing",
    }[String(error.code)] ?? "database-query"];
  }
  return ["configuration"];
}

inspect().catch((error: unknown) => {
  const fields = diagnosticFields(error);
  console.error(`Admin backend configuration failed. Review: ${[...new Set(fields)].join(", ")}. No values were printed.`);
  process.exitCode = 1;
});
