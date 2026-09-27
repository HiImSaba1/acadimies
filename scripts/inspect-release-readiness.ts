import { loadProductionEnvironment } from "./lib/load-production-env";

loadProductionEnvironment();

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type { RowDataPacket } from "mysql2";
import { categoryPages } from "../src/features/category-pages/catalog";
import { readServerEnvironment } from "../src/lib/env/server";

type TableRow = RowDataPacket & { TABLE_NAME: string };
type ColumnRow = RowDataPacket & {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
};
type CountRow = RowDataPacket & { total: number | string };
type SlugRow = RowDataPacket & { slug: string };
type MediaRow = RowDataPacket & { id: string; public_url: string };
type PublishedMediaRow = RowDataPacket & {
  featured_media_id: string | null;
  secondary_media_id: string | null;
  content_document: unknown;
};

const requiredTables = [
  "users", "categories", "posts", "post_categories", "tags", "post_tags", "post_revisions",
  "media_assets", "post_daily_views", "newsletter_subscribers", "newsletter_consent_events",
  "newsletter_campaigns", "newsletter_outbox", "legacy_import_batches", "legacy_import_records",
] as const;

async function scalar(pool: import("mysql2/promise").Pool, query: string, parameters: unknown[] = []) {
  const [rows] = await pool.query<CountRow[]>(query, parameters);
  return Number(rows[0]?.total ?? 0);
}

function localPublicPath(publicRoot: string, publicUrl: string) {
  try {
    const pathname = decodeURIComponent(new URL(publicUrl, "https://acadimies.gr").pathname);
    if (!pathname.startsWith("/")) return null;
    const target = resolve(publicRoot, `.${pathname}`);
    const fromRoot = relative(publicRoot, target);
    return fromRoot.startsWith("..") || isAbsolute(fromRoot) ? null : target;
  } catch {
    return null;
  }
}

function collectMediaIds(value: unknown, result = new Set<string>()) {
  if (!value || typeof value !== "object") return result;
  if (Array.isArray(value)) {
    for (const item of value) collectMediaIds(item, result);
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "mediaId" && typeof child === "string" && child.length > 0) result.add(child);
    else collectMediaIds(child, result);
  }
  return result;
}

function parsedDocument(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

async function main() {
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Release inspection is restricted to next_acadimies.");
  const { pool } = await import("../src/db");
  try {
    const [tableRows] = await pool.query<TableRow[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)",
      [databaseName, requiredTables],
    );
    const availableTables = new Set(tableRows.map((row) => row.TABLE_NAME));
    const missingTables = requiredTables.filter((table) => !availableTables.has(table));

    const [columnRows] = await pool.query<ColumnRow[]>(`SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE,
      IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN (?) ORDER BY TABLE_NAME, ORDINAL_POSITION`, [databaseName, requiredTables]);
    const schemaFingerprint = createHash("sha256").update(JSON.stringify(columnRows.map((row) => ({
      table: row.TABLE_NAME, column: row.COLUMN_NAME, type: row.COLUMN_TYPE,
      nullable: row.IS_NULLABLE, default: row.COLUMN_DEFAULT,
    })))).digest("hex");

    const categoryAliases: string[] = categoryPages.flatMap((category) =>
      [category.slug, category.legacySlug]);
    const [categoryRows] = await pool.query<SlugRow[]>(
      `SELECT slug FROM categories WHERE slug IN (${categoryAliases.map(() => "?").join(",")})`,
      categoryAliases,
    );
    const availableSlugs = new Set(categoryRows.map((row) => row.slug));
    const missingCategories = categoryPages.filter((category) =>
      !availableSlugs.has(category.slug) && (!category.legacySlug || !availableSlugs.has(category.legacySlug)))
      .map((category) => category.slug);
    const categoryCoverage = categoryPages.map((category) => ({
      publicSlug: category.slug,
      databaseSlug: availableSlugs.has(category.slug) ? category.slug
        : category.legacySlug && availableSlugs.has(category.legacySlug) ? category.legacySlug : null,
    }));

    const [publishedPosts, brokenFeaturedReferences, publishedWithoutFeaturedMedia, promotedLedgerRecords] = await Promise.all([
      scalar(pool, "SELECT COUNT(*) AS total FROM posts WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP(3)"),
      scalar(pool, `SELECT COUNT(*) AS total FROM posts p LEFT JOIN media_assets m ON m.id = p.featured_media_id
        WHERE p.featured_media_id IS NOT NULL AND m.id IS NULL`),
      scalar(pool, "SELECT COUNT(*) AS total FROM posts WHERE status = 'published' AND featured_media_id IS NULL"),
      scalar(pool, "SELECT COUNT(*) AS total FROM legacy_import_records WHERE state = 'promoted'"),
    ]);

    const [mediaRows] = await pool.query<MediaRow[]>(`SELECT id, public_url FROM media_assets
      WHERE public_url IS NOT NULL AND public_url LIKE '/%'`);
    const [publishedMediaRows] = await pool.query<PublishedMediaRow[]>(`SELECT featured_media_id,
      secondary_media_id, content_document FROM posts WHERE status = 'published'
      AND published_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP(3)`);
    const referencedMediaIds = new Set<string>();
    for (const row of publishedMediaRows) {
      if (row.featured_media_id) referencedMediaIds.add(row.featured_media_id);
      if (row.secondary_media_id) referencedMediaIds.add(row.secondary_media_id);
      collectMediaIds(parsedDocument(row.content_document), referencedMediaIds);
    }
    const publicRoot = resolve(process.cwd(), "public");
    let unsafeLocalMediaPaths = 0;
    let missingLibraryMediaFiles = 0;
    let missingReferencedLocalMediaFiles = 0;
    const missingLibraryMediaSample: string[] = [];
    const missingReferencedMediaSample: string[] = [];
    for (const row of mediaRows) {
      const target = localPublicPath(publicRoot, row.public_url);
      if (!target) unsafeLocalMediaPaths += 1;
      else if (!existsSync(target)) {
        missingLibraryMediaFiles += 1;
        if (missingLibraryMediaSample.length < 10) missingLibraryMediaSample.push(row.public_url);
        if (referencedMediaIds.has(row.id)) {
          missingReferencedLocalMediaFiles += 1;
          if (missingReferencedMediaSample.length < 10) missingReferencedMediaSample.push(row.public_url);
        }
      }
    }

    const smtpDisabled = process.env.SMTP_ENABLED === "false";
    const smtpCredentialsConfigured = Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_USERNAME?.trim() && process.env.SMTP_PASSWORD,
    );
    const smtpPort = Number(process.env.SMTP_PORT ?? 465);
    const smtpReady = !smtpDisabled && smtpCredentialsConfigured
      && Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort <= 65_535;
    const contactRecipientConfigured = Boolean(
      process.env.CONTACT_RECIPIENT_EMAIL?.trim() || process.env.CONTACT_TO_EMAIL?.trim(),
    );
    const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
    const productionOriginReady = Boolean(nextAuthUrl && /^https:\/\/acadimies\.gr\/?$/i.test(nextAuthUrl));

    const blockers = [
      ...(missingTables.length ? ["missing-database-tables"] : []),
      ...(missingCategories.length ? ["missing-public-categories"] : []),
      ...(publishedPosts < 1 ? ["no-published-content"] : []),
      ...(brokenFeaturedReferences ? ["broken-featured-media-references"] : []),
      ...(unsafeLocalMediaPaths ? ["unsafe-local-media-paths"] : []),
      ...(missingReferencedLocalMediaFiles ? ["missing-referenced-local-media-files"] : []),
      ...(!smtpReady ? ["smtp-not-ready"] : []),
      ...(!contactRecipientConfigured ? ["contact-recipient-not-configured"] : []),
    ];

    process.stdout.write(`${JSON.stringify({
      mode: "read-only-release-inspection",
      target: databaseName,
      releaseReadyForLocalVerification: blockers.length === 0,
      blockers,
      database: { requiredTables: requiredTables.length, missingTables, schemaFingerprint },
      content: { publishedPosts, promotedLedgerRecords, missingCategories, categoryCoverage,
        publishedWithoutFeaturedMedia, brokenFeaturedReferences },
      media: { localRecords: mediaRows.length, referencedMediaRecords: referencedMediaIds.size,
        missingLibraryMediaFiles, missingLibraryMediaSample, missingReferencedLocalMediaFiles,
        missingReferencedMediaSample, unsafeLocalMediaPaths },
      delivery: { smtpReady, contactRecipientConfigured, deliveryAttempted: false },
      deployment: { productionOriginReady, requiresLiveHostVerification: true,
        restoreBaselineReady: missingTables.length === 0, restorePerformed: false },
      safety: { databaseWrites: false, filesWritten: false, personalDataPrinted: false,
        secretsPrinted: false },
    }, null, 2)}\n`);
    if (blockers.length) throw new Error(`Release readiness blockers: ${blockers.join(", ")}.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Release readiness inspection failed."} No secrets were printed.\n`);
  process.exitCode = 1;
});
