import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import sharp from "sharp";
import { pool } from "../src/db";
import { goldenCupDemoPosts, retainedGoldenCupLegacySlug, retainedGoldenCupSlug,
  retiredGoldenCupDemoSlugs } from "../src/features/admin-articles/golden-cup-demo";

const apply = process.env.ACADIMIES_GOLDEN_CUP_DEMO_APPLY === "1";

type UserRow = RowDataPacket & { id: string; display_name: string };
type CategoryRow = RowDataPacket & { id: string; name: string };
type MediaRow = RowDataPacket & { id: string; alt_text: string | null; storage_key: string; public_url: string };
type ExistingRow = RowDataPacket & { id: string; slug: string; title: string; legacy_wordpress_id: number | null };
type TagRow = RowDataPacket & { id: string; slug: string };
type RedirectRow = RowDataPacket & { post_id: string };

const coverUrl = "/images/2026/09/ad_golden_cup_xmas_poster_mobile.webp";
const bodyImageDirectory = join(process.cwd(), "public", "images", "2026", "01");

async function desiredLocalMedia() {
  const bodyNames = (await readdir(bodyImageDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
    .map((entry) => entry.name).sort((left, right) => left.localeCompare(right, "en"))
    .slice(0, 7);
  if (!bodyNames.length) throw new Error("No WEBP images were found in public/images/2026/01.");
  return [coverUrl, ...bodyNames.map((name) => `/images/2026/01/${name}`)];
}

async function inspectLocalMedia(publicUrl: string) {
  const relativePath = publicUrl.replace(/^\//, "");
  const filePath = join(process.cwd(), "public", ...relativePath.split("/"));
  const [bytes, file, metadata] = await Promise.all([readFile(filePath), stat(filePath), sharp(filePath).metadata()]);
  if (metadata.format !== "webp") throw new Error(`Golden Cup demo media must be WEBP: ${publicUrl}`);
  return { id: randomUUID(), publicUrl, storageKey: `local-${relativePath}`.slice(0, 191),
    alt: publicUrl === coverUrl ? "27ο Golden Cup · 3–5 Ιανουαρίου 2027 στο Planet FC" : `27ο Golden Cup · ${basename(publicUrl, ".webp")}`,
    byteSize: file.size, width: metadata.width ?? null, height: metadata.height ?? null,
    checksum: createHash("sha256").update(bytes).digest("hex") };
}

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Golden Cup demo seeding is restricted to next_acadimies.");

  const desiredMediaUrls = await desiredLocalMedia();
  const [[author], [category], registeredMediaRows] = await Promise.all([
    pool.query<UserRow[]>(`SELECT id, display_name FROM users WHERE is_active = true
      ORDER BY display_name = 'Δώρα Ιωακειμίδου' DESC, role = 'owner' DESC, created_at ASC LIMIT 1`).then(([rows]) => rows),
    pool.query<CategoryRow[]>(`SELECT id, name FROM categories ORDER BY
      (name LIKE '%διοργαν%' OR name LIKE '%Golden%') DESC, created_at ASC LIMIT 1`).then(([rows]) => rows),
    pool.query<MediaRow[]>(`SELECT id, alt_text, storage_key, public_url FROM media_assets
      WHERE public_url IN (${desiredMediaUrls.map(() => "?").join(",")})`, desiredMediaUrls).then(([rows]) => rows),
  ]);
  if (!author) throw new Error("No active author exists. Bootstrap the admin or apply the author repair first.");
  if (!category) throw new Error("No category exists for the demo drafts.");

  const registeredByUrl = new Map(registeredMediaRows.map((media) => [media.public_url, media]));
  const missingMedia = await Promise.all(desiredMediaUrls.filter((url) => !registeredByUrl.has(url)).map(inspectLocalMedia));
  if (apply) {
    for (const media of missingMedia) {
      await pool.query(`INSERT INTO media_assets (id, uploader_id, storage_key, public_url, original_url,
        mime_type, byte_size, width, height, alt_text, checksum_sha256, legacy_wordpress_id)
        VALUES (?, ?, ?, ?, NULL, 'image/webp', ?, ?, ?, ?, ?, NULL)`,
      [media.id, author.id, media.storageKey, media.publicUrl, media.byteSize, media.width, media.height, media.alt, media.checksum]);
    }
  }
  const localMedia = desiredMediaUrls.map((url) => {
    const registered = registeredByUrl.get(url);
    const pending = missingMedia.find((media) => media.publicUrl === url);
    if (registered) return { id: registered.id, alt: registered.alt_text?.trim() || `Εικόνα Golden Cup · ${registered.storage_key}`, publicUrl: url };
    if (pending) return { id: pending.id, alt: pending.alt, publicUrl: url };
    throw new Error(`Could not resolve Golden Cup demo media: ${url}`);
  });
  const coverMedia = localMedia[0];
  const bodyMedia = localMedia.slice(1);
  if (!coverMedia || !bodyMedia.length) throw new Error("Golden Cup demo media selection is incomplete.");
  const fixtures = goldenCupDemoPosts(bodyMedia);
  const slugs = fixtures.map((fixture) => fixture.slug);
  const activeSlugSet = new Set<string>(slugs);
  const retiredSlugSet = new Set<string>(retiredGoldenCupDemoSlugs);
  const managedSlugs = [...slugs, retainedGoldenCupLegacySlug, ...retiredGoldenCupDemoSlugs];
  const [existingRows] = await pool.query<ExistingRow[]>(`SELECT id, slug, title, legacy_wordpress_id FROM posts
    WHERE slug IN (${managedSlugs.map(() => "?").join(",")})`, managedSlugs);
  const unsafeCollision = existingRows.find((row) => row.legacy_wordpress_id !== null || !row.title.startsWith("27ο Golden Cup:"));
  if (unsafeCollision) throw new Error(`Protected slug collision: ${unsafeCollision.slug}. No changes were made.`);
  const targetRow = existingRows.find((row) => row.slug === retainedGoldenCupSlug);
  const legacyRetainedRow = existingRows.find((row) => row.slug === retainedGoldenCupLegacySlug);
  if (targetRow && legacyRetainedRow) throw new Error("Both the retained legacy slug and target slug exist. No changes were made.");
  const activeRows = targetRow ? [targetRow] : legacyRetainedRow ? [legacyRetainedRow] : [];
  const retiredRows = existingRows.filter((row) => retiredSlugSet.has(row.slug));

  const resultBase = { target, status: "published", category: category.name, author: author.display_name,
    coverImage: coverUrl, bodyImageFolder: "/images/2026/01", mediaRegisteredOnApply: missingMedia.length,
    templates: fixtures.map((fixture) => ({ template: fixture.template, slug: fixture.slug,
      editorUrl: `/admin/articles/{id}/edit`, websiteUrl: `/posts/${fixture.slug}` })),
    seoIncluded: true, newsletterActivity: false, publicContentWrites: false };
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", ...resultBase, willCreate: fixtures.length - activeRows.length,
      willRefresh: targetRow ? 1 : 0, willRenameRetainedArticle: legacyRetainedRow
        ? { from: retainedGoldenCupLegacySlug, to: retainedGoldenCupSlug } : null,
      willRemoveRetiredDemos: retiredRows.map((row) => row.slug),
      databaseWrites: false, mediaFilesDeleted: false }, null, 2)}\n`);
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const tagSpecs = [{ name: "27ο Golden Cup", slug: "27o-golden-cup" },
      { name: "Τουρνουά ακαδημιών", slug: "tournoua-akadimion" },
      { name: "Planet FC", slug: "planet-fc" }];
    const tagIds: string[] = [];
    for (const tag of tagSpecs) {
      const [rows] = await connection.query<TagRow[]>("SELECT id, slug FROM tags WHERE slug = ? LIMIT 1", [tag.slug]);
      let id = rows[0]?.id;
      if (!id) {
        id = randomUUID();
        await connection.query("INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)", [id, tag.name, tag.slug]);
      }
      tagIds.push(id);
    }

    let created = 0;
    let refreshed = 0;
    let retiredDemosRemoved = 0;
    if (retiredRows.length) {
      const retiredIds = retiredRows.map((row) => row.id);
      const placeholders = retiredIds.map(() => "?").join(",");
      await connection.query(`DELETE FROM post_daily_views WHERE post_id IN (${placeholders})`, retiredIds);
      await connection.query(`DELETE FROM post_tags WHERE post_id IN (${placeholders})`, retiredIds);
      await connection.query(`DELETE FROM post_categories WHERE post_id IN (${placeholders})`, retiredIds);
      await connection.query(`DELETE FROM post_revisions WHERE post_id IN (${placeholders})`, retiredIds);
      await connection.query(`DELETE FROM post_redirects WHERE post_id IN (${placeholders})`, retiredIds);
      await connection.query(`UPDATE legacy_import_records SET promoted_post_id = NULL, state = 'excluded', updated_at = CURRENT_TIMESTAMP(3)
        WHERE promoted_post_id IN (${placeholders})`, retiredIds);
      const [deleted] = await connection.query<ResultSetHeader>(`DELETE FROM posts WHERE id IN (${placeholders})`, retiredIds);
      retiredDemosRemoved = Number(deleted.affectedRows);
      if (retiredDemosRemoved !== retiredRows.length) throw new Error("Retired Golden Cup demo cleanup did not remove the expected records.");
    }
    const links: { template: string; slug: string; editorUrl: string; websiteUrl: string }[] = [];
    for (const [index, fixture] of fixtures.entries()) {
      const existing = activeRows.find((row) => activeSlugSet.has(row.slug) || row.slug === retainedGoldenCupLegacySlug);
      const postId = existing?.id ?? randomUUID();
      const featured = coverMedia.id;
      const secondary = bodyMedia[index % bodyMedia.length]?.id ?? null;
      if (existing) {
        await connection.query(`UPDATE posts SET author_id = ?, title = ?, slug = ?, excerpt = ?, status = 'published',
          header_template = NULL, article_template = ?, content_document = ?, featured_media_id = ?,
          secondary_media_id = ?, published_at = COALESCE(published_at, CURRENT_TIMESTAMP(3)), scheduled_for = NULL, seo_title = ?,
          seo_description = ?, canonical_url = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [author.id, fixture.title, fixture.slug, fixture.excerpt, fixture.template, JSON.stringify(fixture.document), featured,
          secondary, fixture.seoTitle, fixture.seoDescription, `/posts/${fixture.slug}`, postId]);
        if (existing.slug === retainedGoldenCupLegacySlug) {
          const [redirectRows] = await connection.query<RedirectRow[]>(
            "SELECT post_id FROM post_redirects WHERE source_slug = ? LIMIT 1",
            [retainedGoldenCupLegacySlug],
          );
          const redirectPostId = redirectRows[0]?.post_id;
          if (redirectPostId && redirectPostId !== postId) {
            throw new Error(`Protected redirect collision: ${retainedGoldenCupLegacySlug}. No changes were made.`);
          }
          if (!redirectPostId) {
            await connection.query("INSERT INTO post_redirects (id, post_id, source_slug, created_by) VALUES (?, ?, ?, ?)",
              [randomUUID(), postId, retainedGoldenCupLegacySlug, author.id]);
          }
        }
        refreshed += 1;
      } else {
        await connection.query(`INSERT INTO posts (id, author_id, title, slug, excerpt, status, header_template,
          article_template, content_document, featured_media_id, secondary_media_id, published_at, seo_title,
          seo_description, canonical_url) VALUES (?, ?, ?, ?, ?, 'published', NULL, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?, ?, ?)`,
        [postId, author.id, fixture.title, fixture.slug, fixture.excerpt, fixture.template,
          JSON.stringify(fixture.document), featured, secondary, fixture.seoTitle, fixture.seoDescription,
          `/posts/${fixture.slug}`]);
        created += 1;
      }
      await connection.query("DELETE FROM post_categories WHERE post_id = ?", [postId]);
      await connection.query("INSERT INTO post_categories (post_id, category_id, position) VALUES (?, ?, 0)", [postId, category.id]);
      await connection.query("DELETE FROM post_tags WHERE post_id = ?", [postId]);
      for (const tagId of tagIds) await connection.query("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", [postId, tagId]);
      links.push({ template: fixture.template, slug: fixture.slug, editorUrl: `/admin/articles/${postId}/edit`,
        websiteUrl: `/posts/${fixture.slug}` });
    }
    await connection.query(`INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, metadata)
      VALUES (?, ?, 'demo.golden_cup_templates.seed', 'publication', ?, ?)`,
    [randomUUID(), author.id, randomUUID(), JSON.stringify({ created, refreshed, renamedRetainedArticle: Boolean(legacyRetainedRow), retiredDemosRemoved,
      retiredDemoSlugs: retiredRows.map((row) => row.slug), status: "published", templates: fixtures.length })]);
    await connection.commit();
    process.stdout.write(`${JSON.stringify({ mode: "applied", ...resultBase, created, refreshed,
      renamedRetainedArticle: legacyRetainedRow ? { from: retainedGoldenCupLegacySlug, to: retainedGoldenCupSlug } : null, retiredDemosRemoved,
      retiredDemoSlugs: retiredRows.map((row) => row.slug), links,
      databaseWrites: true, mediaFilesWritten: false, publicContentWrites: true }, null, 2)}\n`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Golden Cup demo seeding failed."} No secrets were printed.\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
