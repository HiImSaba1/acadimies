import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

const apply = process.env.ACADIMIES_ANALYTICS_APPLY === "1";

async function tableExists() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'post_daily_views'");
  return Number(rows[0]?.total ?? 0) === 1;
}

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Analytics migration is restricted to next_acadimies.");
  let exists = await tableExists();
  let created = false;
  if (!exists && apply) {
    await pool.query(`CREATE TABLE post_daily_views (
      post_id CHAR(36) NOT NULL,
      view_date DATE NOT NULL,
      views INT UNSIGNED NOT NULL DEFAULT 0,
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (post_id, view_date),
      INDEX post_daily_views_date_idx (view_date)
    ) ENGINE=InnoDB`);
    exists = await tableExists();
    created = exists;
  }
  process.stdout.write(`${JSON.stringify({ target, table: "post_daily_views", schemaReady: exists,
    status: created ? "created" : exists ? "ready" : "missing", databaseWrites: created }, null, 2)}\n`);
  if (!exists) throw new Error("Readership analytics table is missing. Run npm run analytics:migrate once.");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Analytics migration failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
