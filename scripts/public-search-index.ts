import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { readServerEnvironment } from "../src/lib/env/server";

type IndexRow = RowDataPacket & { INDEX_NAME: string; INDEX_TYPE: string; columns: string };

const indexName = "posts_public_search_fulltext";

async function main() {
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Search index target must be next_acadimies.");
  const { pool } = await import("../src/db");
  try {
    const [rows] = await pool.query<IndexRow[]>(`select INDEX_NAME, INDEX_TYPE,
      group_concat(COLUMN_NAME order by SEQ_IN_INDEX separator ',') as columns
      from information_schema.STATISTICS where TABLE_SCHEMA = ? and TABLE_NAME = 'posts' and INDEX_NAME = ?
      group by INDEX_NAME, INDEX_TYPE`, [databaseName, indexName]);
    const ready = rows.some((row) => row.INDEX_TYPE === "FULLTEXT" && row.columns === "title,excerpt,sanitized_legacy_html");
    if (ready) {
      console.log(JSON.stringify({ target: databaseName, index: indexName, status: "ready", databaseWrites: false }));
      return;
    }
    if (process.env.ACADIMIES_SEARCH_INDEX_APPLY !== "1") {
      throw new Error("Public search FULLTEXT index is missing. Run npm run search:index:migrate once, then verify again.");
    }
    await pool.query(`ALTER TABLE posts ADD FULLTEXT INDEX ${indexName} (title, excerpt, sanitized_legacy_html)`);
    console.log(JSON.stringify({ target: databaseName, index: indexName, status: "created", databaseWrites: true, otherSchemaChanges: false }));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Search index operation failed.";
  console.error(`${message} No credentials were printed.`);
  process.exitCode = 1;
});
