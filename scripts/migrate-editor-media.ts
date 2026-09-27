import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { readServerEnvironment } from "../src/lib/env/server";

type ColumnRow = RowDataPacket & { COLUMN_NAME: string };

async function migrate() {
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Migration target must be next_acadimies.");
  const { pool } = await import("../src/db");
  try {
    const [rows] = await pool.query<ColumnRow[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'secondary_media_id'",
      [databaseName],
    );
    if (rows.length) {
      console.log(JSON.stringify({ target: databaseName, column: "posts.secondary_media_id", status: "already-present", otherSchemaChanges: false }));
      return;
    }
    try {
      await pool.query("ALTER TABLE posts ADD COLUMN secondary_media_id CHAR(36) NULL AFTER featured_media_id");
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_FIELDNAME") {
        console.log(JSON.stringify({ target: databaseName, column: "posts.secondary_media_id", status: "already-present", otherSchemaChanges: false }));
        return;
      }
      throw error;
    }
    console.log(JSON.stringify({ target: databaseName, column: "posts.secondary_media_id", status: "added", otherSchemaChanges: false }));
  } finally {
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "migration-failed";
  console.error(`Editor media migration failed (${code}). No credentials were printed.`);
  process.exitCode = 1;
});
