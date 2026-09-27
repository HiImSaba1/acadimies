import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { readServerEnvironment } from "../src/lib/env/server";

const values = ["longform", "matchday", "gallery", "interview", "cinematic", "chess", "sidebar"] as const;
type ColumnRow = RowDataPacket & { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string };

async function migrate() {
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Migration target must be next_acadimies.");
  const { pool } = await import("../src/db");
  const apply = process.env.ACADIMIES_ARTICLE_TEMPLATES_APPLY === "1";
  try {
    const [rows] = await pool.query<ColumnRow[]>(
      "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND ((TABLE_NAME = 'posts' AND COLUMN_NAME = 'article_template') OR (TABLE_NAME = 'categories' AND COLUMN_NAME = 'default_article_template'))",
      [databaseName],
    );
    const missing = values.filter((value) => rows.some((row) => !row.COLUMN_TYPE.includes(`'${value}'`)));
    if (!missing.length) {
      console.log(JSON.stringify({ target: databaseName, status: "ready", databaseWrites: false, templates: values }));
      return;
    }
    if (!apply) {
      console.log(JSON.stringify({ target: databaseName, status: "migration-required", databaseWrites: false, missing }));
      process.exitCode = 1;
      return;
    }
    const enumSql = values.map((value) => `'${value}'`).join(",");
    await pool.query(`ALTER TABLE posts MODIFY article_template ENUM(${enumSql}) NULL`);
    await pool.query(`ALTER TABLE categories MODIFY default_article_template ENUM(${enumSql}) NULL`);
    console.log(JSON.stringify({ target: databaseName, status: "migrated", databaseWrites: true, templates: values, otherSchemaChanges: false }));
  } finally {
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "migration-failed";
  console.error(`Article template migration failed (${code}). No credentials were printed.`);
  process.exitCode = 1;
});
