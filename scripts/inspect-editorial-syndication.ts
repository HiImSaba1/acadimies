import "dotenv/config";

import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

type Candidate = RowDataPacket & { public_url: string; published_at: Date | string };

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Syndication inspection is restricted to next_acadimies.");
  const [rows] = await pool.query<Candidate[]>(`SELECT m.public_url, p.published_at FROM posts p
    INNER JOIN media_assets m ON m.id = p.featured_media_id
    WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP(3)
      AND p.slug NOT LIKE 'demo-%' AND m.public_url IS NOT NULL AND m.mime_type LIKE 'image/%'
    ORDER BY p.published_at DESC LIMIT 1000`);
  const publicRoot = resolve(process.cwd(), "public");
  const localFileExists = (url: string) => {
    if (!url.startsWith("/")) return true;
    const file = resolve(publicRoot, `.${url}`);
    return file.startsWith(`${publicRoot}${sep}`) && existsSync(file);
  };
  const eligible = rows.filter((row) => localFileExists(String(row.public_url)));
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recent = eligible.filter((row) => new Date(row.published_at instanceof Date
    ? row.published_at.getTime() : row.published_at).getTime() >= twoDaysAgo);
  process.stdout.write(`${JSON.stringify({ target, rssEligible: Math.min(eligible.length, 50),
    newsEligible: Math.min(recent.length, 1000), excludedMissingLocalMedia: rows.length - eligible.length,
    feedPath: "/feed.xml", newsSitemapPath: "/news-sitemap.xml", databaseWrites: false,
    searchEngineSubmissionAttempted: false, articleDataPrinted: false }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Syndication inspection failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
