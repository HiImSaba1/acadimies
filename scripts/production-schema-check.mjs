import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

const environmentPath = resolve(process.cwd(), ".env.production.local");
if (!existsSync(environmentPath)) throw new Error("Missing .env.production.local in the application root.");
loadEnvFile(environmentPath);

const requiredTables = [
  "users", "categories", "posts", "post_categories", "post_daily_views", "tags", "post_tags",
  "post_revisions", "post_redirects", "media_assets", "audit_events", "newsletter_subscribers",
  "newsletter_consent_events", "newsletter_campaigns", "newsletter_outbox", "legacy_import_batches",
  "legacy_import_records",
];

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const required = ["DB_HOST", "DB_NAME", "DB_USER"];
  for (const name of required) if (!process.env[name]?.trim()) throw new Error(`Missing ${name}.`);
  const credentials = `${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD ?? "")}`;
  return `mysql://${credentials}@${process.env.DB_HOST}:${process.env.DB_PORT ?? "3306"}/${process.env.DB_NAME}`;
}

async function main() {
  const url = databaseUrl();
  const databaseName = new URL(url).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Schema check is restricted to next_acadimies.");
  const connection = await mysql.createConnection(url);
  try {
    const [rows] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [databaseName],
    );
    const actual = new Set(rows.map((row) => String(row.TABLE_NAME)));
    const missing = requiredTables.filter((table) => !actual.has(table));
    process.stdout.write(`${JSON.stringify({ mode: "read-only-schema-check", database: databaseName,
      expectedTables: requiredTables.length, missingTables: missing, writes: false }, null, 2)}\n`);
    if (missing.length) throw new Error(`Production schema is incomplete: ${missing.join(", ")}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Schema check failed."} No secrets were printed.\n`);
  process.exitCode = 1;
});
