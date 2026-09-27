import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

const apply = process.env.ACADIMIES_POST_REDIRECTS_APPLY === "1";

async function tableExists() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'post_redirects'");
  return Number(rows[0]?.total ?? 0) === 1;
}

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Post redirect migration is restricted to next_acadimies.");
  let exists = await tableExists();
  let created = false;
  if (!exists && apply) {
    await pool.query(`CREATE TABLE post_redirects (
      id CHAR(36) NOT NULL,
      post_id CHAR(36) NOT NULL,
      source_slug VARCHAR(191) NOT NULL,
      created_by CHAR(36) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY post_redirect_source_unique (source_slug),
      KEY post_redirect_post_idx (post_id, created_at)
    ) ENGINE=InnoDB`);
    exists = await tableExists();
    created = exists;
  }
  process.stdout.write(`${JSON.stringify({ target, table: "post_redirects", schemaReady: exists,
    status: created ? "created" : exists ? "ready" : "missing", databaseWrites: created }, null, 2)}\n`);
  if (!exists) throw new Error("Post redirects table is missing. Run npm run redirects:migrate once.");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Post redirect migration failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
