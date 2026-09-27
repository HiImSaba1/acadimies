import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { readServerEnvironment } from "../src/lib/env/server";

type ColumnRow = RowDataPacket & { COLUMN_NAME: string };
type TableRow = RowDataPacket & { TABLE_NAME: string };
type CountRow = RowDataPacket & { count: number };

async function inspect() {
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  const { pool } = await import("../src/db");
  try {
    const [columns] = await pool.query<ColumnRow[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts'",
      [databaseName],
    );
    const [tables] = await pool.query<TableRow[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'media_assets'",
      [databaseName],
    );
    const names = new Set(columns.map((row) => row.COLUMN_NAME));
    const postsReady = ["featured_media_id", "secondary_media_id", "seo_title", "seo_description"].every((name) => names.has(name));
    const mediaReady = tables.length === 1;
    const [counts] = mediaReady ? await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS count FROM media_assets WHERE mime_type LIKE 'image/%' AND public_url IS NOT NULL",
    ) : [[] as CountRow[]];
    console.log(JSON.stringify({
      database: databaseName,
      postsMediaAndSeoColumnsReady: postsReady,
      mediaAssetsTableReady: mediaReady,
      selectableImageRecords: counts[0]?.count ?? null,
      databaseWrites: false,
      mediaDownloads: false,
      migrationAttempted: false,
    }, null, 2));
    if (!postsReady || !mediaReady) {
      throw new Error("Editor media schema is not ready. Run npm run editor:media:migrate before Sprint09CVerify.");
    }
  } finally {
    await pool.end();
  }
}

inspect().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Editor media inspection failed.");
  process.exitCode = 1;
});
