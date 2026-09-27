import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";
import { inspectWordPressExport } from "../src/features/wordpress-import/inspect";
import { createWordPressPostPlan } from "../src/features/wordpress-import/post-plan";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

async function groupedCounts(query: string) {
  const [rows] = await pool.query<RowDataPacket[]>(query);
  return Object.fromEntries(rows.map((row) => [String(row.label), Number(row.total)]));
}

async function scalar(query: string) {
  const [rows] = await pool.query<RowDataPacket[]>(query);
  return Number(rows[0]?.total ?? 0);
}

async function main() {
  const source = resolve(option("--source") ?? "WordPress.2026-09-14.xml");
  const xml = await readFile(source, "utf8");
  const inspection = inspectWordPressExport(xml);
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(inspection.source.siteUrl)) throw new Error("Unexpected WXR site origin.");
  const plan = createWordPressPostPlan(inspection);
  const [postStates, ledgerStates, promotedPosts, importedMedia, missingLegacyUrl, futurePublished, danglingPromotions] = await Promise.all([
    groupedCounts("SELECT status AS label, COUNT(*) AS total FROM posts WHERE legacy_wordpress_id IS NOT NULL GROUP BY status"),
    groupedCounts("SELECT state AS label, COUNT(*) AS total FROM legacy_import_records GROUP BY state"),
    scalar("SELECT COUNT(*) AS total FROM posts WHERE legacy_wordpress_id IS NOT NULL"),
    scalar("SELECT COUNT(*) AS total FROM media_assets WHERE legacy_wordpress_id IS NOT NULL"),
    scalar("SELECT COUNT(*) AS total FROM posts WHERE legacy_wordpress_id IS NOT NULL AND (legacy_url IS NULL OR legacy_url = '')"),
    scalar("SELECT COUNT(*) AS total FROM posts WHERE status = 'published' AND published_at > CURRENT_TIMESTAMP(3)"),
    scalar("SELECT COUNT(*) AS total FROM legacy_import_records r LEFT JOIN posts p ON p.id = r.promoted_post_id WHERE r.state = 'promoted' AND p.id IS NULL"),
  ]);
  const report = {
    mode: "read-only-reconciliation",
    sourceFile: basename(source),
    sourceSha256: createHash("sha256").update(xml).digest("hex"),
    source: {
      items: inspection.items.length,
      eligibleArticlesAndPages: plan.counts.eligibleForReview,
      originallyPublished: plan.counts.publishedOriginally,
      trashed: plan.counts.trashedOriginally,
      quarantined: plan.counts.quarantined,
    },
    database: { promotedPosts, importedMedia, postStates, ledgerStates },
    integrity: { missingLegacyUrl, futurePublished, danglingPromotions },
    databaseWrites: false,
    mediaDownloads: false,
    publicationChanges: false,
    personalDataPrinted: false,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (futurePublished || danglingPromotions) throw new Error("Historical publication integrity checks failed.");
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress publication reconciliation failed: ${error instanceof Error ? error.message : "Unknown error."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
