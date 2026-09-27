import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { inspectWordPressExport } from "../src/features/wordpress-import/inspect";
import { articleDocumentSchema } from "../src/features/articles/document";
import { createWordPressPostPlan, legacyArticleDocument, type WordPressPostCandidate } from "../src/features/wordpress-import/post-plan";
import { canPromoteLegacyDraft, legacyPromotionStatus } from "../src/features/wordpress-import/draft-policy";

function option(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  return position < 0 ? undefined : process.argv[position + 1];
}

async function digestFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

function historicalDate(value: string | null): Date | null {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}Z` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function promote(sourceSha256: string, candidates: WordPressPostCandidate[], options: {
  autoApproveClean: boolean;
  batchSize: number;
  delayMs: number;
}) {
  const [{ db, pool }, schema, { and, eq }] = await Promise.all([
    import("../src/db"), import("../src/db/schema"), import("drizzle-orm"),
  ]);
  const result = { attempted: 0, published: 0, drafted: 0, alreadyImported: 0, awaitingApproval: 0,
    missingFeaturedMedia: 0, featuredBackfilled: 0, bodyImagesBackfilled: 0,
    linkedBodyImages: 0, missingBodyImages: 0, unresolvedCategories: 0,
    createdCategories: 0,
    failed: [] as Array<{ externalId: string; reason: string }> };
  try {
    const batch = await db.query.legacyImportBatches.findFirst({ where: eq(schema.legacyImportBatches.sourceSha256, sourceSha256) });
    if (!batch || batch.state !== "review") throw new Error("Matching WXR review ledger is required before content promotion.");
    const totalBatches = Math.ceil(candidates.length / options.batchSize);
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchCandidates = candidates.slice(batchIndex * options.batchSize, (batchIndex + 1) * options.batchSize);
      for (const candidate of batchCandidates) {
        result.attempted++;
        try {
        const outcome = await db.transaction(async (tx) => {
          const [record] = await tx.select().from(schema.legacyImportRecords).where(and(
            eq(schema.legacyImportRecords.batchId, batch.id),
            eq(schema.legacyImportRecords.sourceType, candidate.originalType),
            eq(schema.legacyImportRecords.externalId, candidate.externalId),
          )).limit(1).for("update");
          if (!record || record.riskFlags.length || record.checksumSha256 !== candidate.checksumSha256 ||
              record.payload.title !== candidate.title || record.payload.sanitizedHtml !== candidate.sanitizedHtml) {
            return { kind: "awaitingApproval" as const };
          }
          const legacyId = Number(candidate.externalId);
          if (!Number.isSafeInteger(legacyId) || legacyId < 1) throw new Error("Invalid legacy post identifier.");
          const [existing] = await tx.select({ id: schema.posts.id, featuredMediaId: schema.posts.featuredMediaId,
            contentDocument: schema.posts.contentDocument }).from(schema.posts)
            .where(eq(schema.posts.legacyWordPressId, legacyId)).limit(1);
          if (record.state === "promoted" && existing && record.promotedPostId === existing.id) {
            const existingDocument = articleDocumentSchema.parse(existing.contentDocument);
            let featuredBackfilled = false;
            if (!existing.featuredMediaId && candidate.featuredMediaExternalId && /^[1-9]\d*$/.test(candidate.featuredMediaExternalId)) {
              const [media] = await tx.select({ id: schema.mediaAssets.id }).from(schema.mediaAssets)
                .where(eq(schema.mediaAssets.legacyWordPressId, Number(candidate.featuredMediaExternalId))).limit(1);
              if (media) {
                await tx.update(schema.posts).set({ featuredMediaId: media.id }).where(eq(schema.posts.id, existing.id));
                await tx.insert(schema.auditEvents).values({ id: randomUUID(), action: "migration.featured_media_backfilled",
                  entityType: "post", entityId: existing.id, metadata: { batchId: batch.id,
                    externalId: candidate.externalId, featuredMediaExternalId: candidate.featuredMediaExternalId } });
                featuredBackfilled = true;
              }
            }
            const linkedMediaIds = new Set(existingDocument.blocks
              .filter((block) => block.type === "image").map((block) => block.mediaId));
            let captionBackfilled = 0;
            let existingBlocks = [...existingDocument.blocks];
            const additionalBlocks: Array<{ type: "image"; mediaId: string; alt: string; caption?: string }> = [];
            for (const externalId of new Set([...candidate.inlineMediaExternalIds, ...candidate.galleryMediaExternalIds])) {
              const legacyMediaId = Number(externalId);
              const [media] = Number.isSafeInteger(legacyMediaId)
                ? await tx.select({ id: schema.mediaAssets.id, altText: schema.mediaAssets.altText }).from(schema.mediaAssets)
                  .where(eq(schema.mediaAssets.legacyWordPressId, legacyMediaId)).limit(1)
                : [];
              if (media) {
                const caption = candidate.mediaCaptions[externalId];
                if (linkedMediaIds.has(media.id) && caption) {
                  existingBlocks = existingBlocks.map((block) => {
                    if (block.type !== "image" || block.mediaId !== media.id || block.caption) return block;
                    captionBackfilled++;
                    return { ...block, caption };
                  });
                } else if (!linkedMediaIds.has(media.id)) {
                  additionalBlocks.push({ type: "image", mediaId: media.id, alt: media.altText || candidate.title,
                    ...(caption ? { caption } : {}) });
                  linkedMediaIds.add(media.id);
                }
              }
            }
            if (additionalBlocks.length || captionBackfilled) {
              await tx.update(schema.posts).set({ contentDocument: { ...existingDocument,
                blocks: [...existingBlocks, ...additionalBlocks] } }).where(eq(schema.posts.id, existing.id));
              await tx.insert(schema.auditEvents).values({ id: randomUUID(), action: "migration.body_media_backfilled",
                entityType: "post", entityId: existing.id, metadata: { batchId: batch.id,
                  externalId: candidate.externalId, imagesAdded: additionalBlocks.length, captionsAdded: captionBackfilled } });
            }
            return { kind: "alreadyImported" as const, featuredBackfilled, bodyImagesBackfilled: additionalBlocks.length };
          }
          const effectiveState = options.autoApproveClean && record.state === "staged" ? "approved" : record.state;
          if (!canPromoteLegacyDraft({ state: effectiveState, sourceType: record.sourceType,
            riskFlags: record.riskFlags, sourceChecksum: candidate.checksumSha256,
            stagedChecksum: record.checksumSha256, existingPostId: existing?.id ?? null })) {
            return { kind: "awaitingApproval" as const };
          }
          if (effectiveState === "approved" && record.state === "staged") {
            await tx.update(schema.legacyImportRecords).set({ state: "approved" })
              .where(eq(schema.legacyImportRecords.id, record.id));
            await tx.insert(schema.auditEvents).values({
              id: randomUUID(), action: "migration.clean_record_auto_approved", entityType: "legacy_import_record",
              entityId: record.id, metadata: { batchId: batch.id, externalId: candidate.externalId,
                sourceSha256, previousState: record.state, state: "approved" },
            });
          }
          if (candidate.title.length > 512) throw new Error("Legacy title exceeds the post title limit.");
          const preferredSlug = candidate.slug.slice(0, 191);
          const [slugOwner] = await tx.select({ id: schema.posts.id }).from(schema.posts)
            .where(eq(schema.posts.slug, preferredSlug)).limit(1);
          const suffix = `-wp-${legacyId}`;
          const slug = slugOwner ? `${preferredSlug.slice(0, 191 - suffix.length).replace(/-+$/g, "")}${suffix}` : preferredSlug;
          if (slugOwner) {
            const [other] = await tx.select({ id: schema.posts.id }).from(schema.posts)
              .where(eq(schema.posts.slug, slug)).limit(1);
            if (other) throw new Error("Both the legacy and deterministic fallback slugs are in use.");
          }
          let featuredMediaId: string | null = null;
          if (candidate.featuredMediaExternalId && /^[1-9]\d*$/.test(candidate.featuredMediaExternalId)) {
            const mediaId = Number(candidate.featuredMediaExternalId);
            if (Number.isSafeInteger(mediaId)) {
              const [media] = await tx.select({ id: schema.mediaAssets.id }).from(schema.mediaAssets)
                .where(eq(schema.mediaAssets.legacyWordPressId, mediaId)).limit(1);
              featuredMediaId = media?.id ?? null;
            }
          }
          const id = randomUUID();
          const document = legacyArticleDocument(candidate);
          const historicalPublishedAt = historicalDate(candidate.publishedAt);
          const targetStatus = legacyPromotionStatus(candidate.originalStatus, historicalPublishedAt);
          let linkedBodyImages = 0;
          let missingBodyImages = 0;
          const bodyIds = new Set([...candidate.inlineMediaExternalIds, ...candidate.galleryMediaExternalIds]);
          for (const externalId of bodyIds) {
            const legacyMediaId = Number(externalId);
            const [media] = Number.isSafeInteger(legacyMediaId) ? await tx.select({ id: schema.mediaAssets.id, altText: schema.mediaAssets.altText })
              .from(schema.mediaAssets).where(eq(schema.mediaAssets.legacyWordPressId, legacyMediaId)).limit(1) : [];
            if (media) {
              document.blocks.push({ type: "image", mediaId: media.id, alt: media.altText || candidate.title,
                ...(candidate.mediaCaptions[externalId] ? { caption: candidate.mediaCaptions[externalId] } : {}) });
              linkedBodyImages++;
            } else missingBodyImages++;
          }
          await tx.insert(schema.posts).values({
            id, title: candidate.title, slug, excerpt: document.dek || null,
            status: targetStatus, headerTemplate: "minimal_editorial", articleTemplate: "longform",
            contentDocument: document, sanitizedLegacyHtml: candidate.sanitizedHtml,
            featuredMediaId, legacyWordPressId: legacyId, legacyUrl: candidate.sourceUrl || null,
            publishedAt: targetStatus === "published" ? historicalPublishedAt : null,
          });
          let unresolvedCategories = 0;
          let createdCategories = 0;
          const categoryIds = new Set<string>();
          for (const category of candidate.categories.filter((category) => category.domain === "category")) {
            if (!category.slug || category.slug.length > 191 || !category.name.trim()) { unresolvedCategories++; continue; }
            const [row] = await tx.select({ id: schema.categories.id }).from(schema.categories)
              .where(eq(schema.categories.slug, category.slug)).limit(1);
            if (row) categoryIds.add(row.id);
            else if (options.autoApproveClean) {
              const categoryId = randomUUID();
              await tx.insert(schema.categories).values({ id: categoryId, slug: category.slug,
                name: category.name.trim().slice(0, 160) });
              categoryIds.add(categoryId);
              createdCategories++;
            } else unresolvedCategories++;
          }
          for (const categoryId of categoryIds) {
            await tx.insert(schema.postCategories).values({ postId: id, categoryId });
          }
          await tx.insert(schema.postRevisions).values({
            id: randomUUID(), postId: id, revisionNumber: 1,
            snapshot: { migration: { sourceSha256, externalId: candidate.externalId, originalStatus: candidate.originalStatus }, document },
            changeSummary: targetStatus === "published"
              ? "Approved WordPress publication imported with its historical publication date"
              : "WordPress archive imported as editorial draft",
          });
          await tx.update(schema.legacyImportRecords).set({ state: "promoted", promotedPostId: id })
            .where(eq(schema.legacyImportRecords.id, record.id));
          await tx.insert(schema.auditEvents).values({
            id: randomUUID(), action: targetStatus === "published" ? "migration.post_published" : "migration.draft_promoted",
            entityType: "post", entityId: id,
            metadata: { batchId: batch.id, externalId: candidate.externalId, sourceSha256, originalStatus: candidate.originalStatus,
              featuredMediaLinked: Boolean(featuredMediaId), unresolvedCategories, createdCategories, targetStatus },
          });
          return { kind: targetStatus as "published" | "draft", missingFeaturedMedia: Boolean(candidate.featuredMediaExternalId && !featuredMediaId),
            linkedBodyImages, missingBodyImages, unresolvedCategories, createdCategories };
        });
        if (outcome.kind === "published" || outcome.kind === "draft") {
          if (outcome.kind === "published") result.published++;
          else result.drafted++;
          if (outcome.missingFeaturedMedia) result.missingFeaturedMedia++;
          result.linkedBodyImages += outcome.linkedBodyImages;
          result.missingBodyImages += outcome.missingBodyImages;
          result.unresolvedCategories += outcome.unresolvedCategories;
          result.createdCategories += outcome.createdCategories;
        } else {
          result[outcome.kind]++;
          if (outcome.kind === "alreadyImported" && outcome.featuredBackfilled) result.featuredBackfilled++;
          if (outcome.kind === "alreadyImported") result.bodyImagesBackfilled += outcome.bodyImagesBackfilled;
        }
        } catch (error) {
          result.failed.push({ externalId: candidate.externalId, reason: error instanceof Error ? error.message : "Unknown content promotion failure." });
        }
      }
      process.stdout.write(`${JSON.stringify({ event: "post-batch-complete", batch: batchIndex + 1, totalBatches,
        attempted: result.attempted, published: result.published, drafted: result.drafted,
        alreadyImported: result.alreadyImported, awaitingApproval: result.awaitingApproval,
        missingFeaturedMedia: result.missingFeaturedMedia, featuredBackfilled: result.featuredBackfilled,
        bodyImagesBackfilled: result.bodyImagesBackfilled,
        missingBodyImages: result.missingBodyImages,
        unresolvedCategories: result.unresolvedCategories, createdCategories: result.createdCategories,
        failed: result.failed.length })}\n`);
      if (options.delayMs > 0 && batchIndex + 1 < totalBatches) await delay(options.delayMs);
    }
    return result;
  } finally {
    await pool.end();
  }
}

async function main() {
  const sourcePath = resolve(option("--source") ?? "WordPress.2026-09-14.xml");
  if (extname(sourcePath).toLowerCase() !== ".xml") throw new Error("WXR source must be XML.");
  const inspection = inspectWordPressExport(await readFile(sourcePath, "utf8"));
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(inspection.source.siteUrl)) throw new Error("Unexpected WXR site origin.");
  const sourceSha256 = await digestFile(sourcePath);
  const plan = createWordPressPostPlan(inspection);
  const apply = process.env.ACADIMIES_WP_PUBLISH_APPLY === "1" || process.env.ACADIMIES_WP_DRAFT_APPLY === "1";
  const automatic = process.env.ACADIMIES_WP_POSTS_AUTO === "1";
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", sourceFile: basename(sourcePath), sourceSha256,
      ...plan.counts, databaseWrites: false, publicContentWrites: false }, null, 2)}\n`);
    return;
  }
  const limit = Number(option("--limit") ?? (automatic ? "20" : "10"));
  const offset = Number(option("--offset") ?? "0");
  const requestedLegacyId = option("--legacy-id");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("--limit must be 1–25 and --offset a non-negative integer.");
  }
  if (requestedLegacyId && (!/^[1-9]\d*$/.test(requestedLegacyId) || !Number.isSafeInteger(Number(requestedLegacyId)))) {
    throw new Error("--legacy-id must be a valid positive WordPress ID.");
  }
  const selected = automatic
    ? plan.candidates.filter((candidate) => candidate.originalStatus === "publish")
    : requestedLegacyId
    ? plan.candidates.filter((candidate) => candidate.externalId === requestedLegacyId)
    : plan.candidates.slice(offset, offset + limit);
  if (requestedLegacyId && !selected.length) throw new Error("Requested WordPress ID is not an eligible article/page.");
  const result = await promote(sourceSha256, selected, { autoApproveClean: automatic, batchSize: limit,
    delayMs: automatic ? 2000 : 0 });
  process.stdout.write(`${JSON.stringify({ mode: automatic ? "automatic-published-posts-apply" : "bounded-approved-content-apply",
    sourceSha256, offset: automatic ? 0 : offset, limit: automatic ? selected.length : limit,
    batchSize: limit, delayMs: automatic ? 2000 : 0, autoApproveClean: automatic,
    legacyId: requestedLegacyId ?? null,
    eligibleForReview: plan.counts.eligibleForReview, ...result, publicContentWrites: result.published > 0 }, null, 2)}\n`);
  if (result.failed.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress draft promotion failed: ${error instanceof Error ? error.message : "Unknown failure."}\n`);
  process.exitCode = 1;
});
