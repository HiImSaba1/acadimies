import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, like, or, sql } from "drizzle-orm";
import {
  auditEvents,
  categories,
  mediaAssets,
  legacyImportRecords,
  postCategories,
  postDailyViews,
  postRedirects,
  postTags,
  postRevisions,
  posts,
  tags,
  users,
} from "@/db/schema";
import { parseArticleRevisionSnapshot, type ArticleMutation } from "./contracts";
import type { AdminArticleSort, AdminArticleStatus } from "./archive-contracts";
import { collectArticleMediaReferences, safePublicMediaUrl, type MediaAssetOption } from "./media-contracts";
import { suggestGreeklishSlug } from "./greeklish-slug";
import { assertRedirectOwnership, needsPublishedSlugRedirect } from "./slug-redirects";
import type { Database } from "@/db";

type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function resolveArticleTagIds(tx: DatabaseTransaction, input: ArticleMutation): Promise<string[]> {
  const selected = [...new Set(input.tagIds)];
  if (selected.length) {
    const rows = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, selected));
    if (rows.length !== selected.length) throw new Error("Unknown article tag.");
  }
  const resolved = [...selected];
  for (const name of input.newTagNames) {
    const [byName] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).limit(1);
    if (byName) {
      if (!resolved.includes(byName.id)) resolved.push(byName.id);
      continue;
    }
    const base = suggestGreeklishSlug(name);
    let createdId: string | null = null;
    for (let suffix = 1; suffix <= 1000; suffix += 1) {
      const suffixText = suffix === 1 ? "" : `-${suffix}`;
      const slug = `${base.slice(0, 191 - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
      const [collision] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
      if (collision) continue;
      createdId = randomUUID();
      await tx.insert(tags).values({ id: createdId, name, slug });
      break;
    }
    if (!createdId) throw new Error("No available tag slug.");
    resolved.push(createdId);
  }
  return [...new Set(resolved)].slice(0, 30);
}

async function database() {
  return (await import("@/db")).db;
}

export async function listAdminArticles() {
  const db = await database();
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorName: users.displayName,
      articleTemplate: posts.articleTemplate,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.updatedAt))
    .limit(100);
}

const archiveYearSql = sql<number>`year(coalesce(${posts.publishedAt}, ${posts.scheduledFor}, ${posts.createdAt}))`;

export async function listAdminArticleYears() {
  const db = await database();
  const rows = await db.select({ year: archiveYearSql, total: sql<number>`count(*)` })
    .from(posts).groupBy(archiveYearSql).orderBy(desc(archiveYearSql));
  return rows.map((row) => ({ year: Number(row.year), total: Number(row.total) }))
    .filter((row) => Number.isSafeInteger(row.year));
}

export async function listAdminArticlesByYear(year: number, sort: AdminArticleSort, page = 1, pageSize = 50, search = "", status: AdminArticleStatus = "all") {
  const db = await database();
  const escapedSearch = search.trim().replace(/[\\%_]/g, "\\$&");
  const where = and(eq(archiveYearSql, year), status === "all" ? undefined : eq(posts.status, status), escapedSearch ? or(
    like(posts.title, `%${escapedSearch}%`),
    like(posts.slug, `%${escapedSearch}%`),
    like(posts.excerpt, `%${escapedSearch}%`),
  ) : undefined);
  const publicationDate = sql`coalesce(${posts.publishedAt}, ${posts.scheduledFor}, ${posts.createdAt})`;
  const order = sort === "az" ? [asc(posts.title), desc(publicationDate)]
    : sort === "za" ? [desc(posts.title), desc(publicationDate)]
      : sort === "oldest" ? [asc(publicationDate), asc(posts.id)]
        : [desc(publicationDate), desc(posts.id)];
  const [items, countRows] = await Promise.all([db.select({
    id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt,
    status: posts.status, scheduledFor: posts.scheduledFor, publishedAt: posts.publishedAt, createdAt: posts.createdAt,
    authorName: users.displayName, imageUrl: mediaAssets.publicUrl,
    imageAlt: mediaAssets.altText,
  }).from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(mediaAssets, eq(posts.featuredMediaId, mediaAssets.id))
    .where(where)
    .orderBy(...order)
    .limit(pageSize).offset((page - 1) * pageSize),
  db.select({ total: sql<number>`count(*)` }).from(posts).where(where)]);
  const total = Number(countRows[0]?.total ?? 0);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function deleteAdminArticle(articleId: string, actorId: string) {
  const db = await database();
  return db.transaction(async (tx) => {
    const [article] = await tx.select({ id: posts.id, slug: posts.slug, title: posts.title,
      authorId: posts.authorId }).from(posts).where(eq(posts.id, articleId)).limit(1);
    if (!article) return null;
    const categoryRows = await tx.select({ slug: categories.slug }).from(postCategories)
      .innerJoin(categories, eq(categories.id, postCategories.categoryId)).where(eq(postCategories.postId, articleId));
    await tx.delete(postTags).where(eq(postTags.postId, articleId));
    await tx.delete(postCategories).where(eq(postCategories.postId, articleId));
    await tx.delete(postRevisions).where(eq(postRevisions.postId, articleId));
    await tx.delete(postDailyViews).where(eq(postDailyViews.postId, articleId));
    await tx.delete(postRedirects).where(eq(postRedirects.postId, articleId));
    await tx.update(legacyImportRecords).set({ promotedPostId: null, state: "excluded" })
      .where(eq(legacyImportRecords.promotedPostId, articleId));
    await tx.delete(posts).where(eq(posts.id, articleId));
    await tx.insert(auditEvents).values({ id: randomUUID(), actorId, action: "article.delete",
      entityType: "post", entityId: articleId, metadata: { title: article.title, slug: article.slug,
        mediaFilesDeleted: false, importRecordRetained: true } });
    return { ...article, categorySlugs: categoryRows.map((row) => row.slug) };
  });
}

export async function listAdminCategories() {
  const db = await database();
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}

export async function listAdminTags() {
  const db = await database();
  return db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name).limit(5000);
}

function toMediaOption(row: { id: string; publicUrl: string | null; altText: string | null; storageKey: string; width: number | null; height: number | null }): MediaAssetOption | null {
  const url = safePublicMediaUrl(row.publicUrl);
  if (!url) return null;
  return { id: row.id, url, alt: row.altText ?? "", label: row.storageKey, width: row.width, height: row.height };
}

export async function searchAdminMedia(input: { search?: string; offset?: number; limit?: number } = {}) {
  const db = await database();
  const search = input.search?.trim().slice(0, 80) ?? "";
  const offset = Math.min(Math.max(input.offset ?? 0, 0), 100_000);
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 48);
  const escaped = search.replace(/[\\%_]/g, "\\$&");
  const rows = await db.select({
    id: mediaAssets.id, publicUrl: mediaAssets.publicUrl, altText: mediaAssets.altText,
    storageKey: mediaAssets.storageKey, width: mediaAssets.width, height: mediaAssets.height,
  }).from(mediaAssets)
    .where(and(like(mediaAssets.mimeType, "image/%"), isNotNull(mediaAssets.publicUrl),
      search ? or(like(mediaAssets.storageKey, `%${escaped}%`), like(mediaAssets.altText, `%${escaped}%`)) : undefined))
    .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id)).offset(offset).limit(limit + 1);
  return { items: rows.slice(0, limit).map(toMediaOption).filter((option): option is MediaAssetOption => option !== null), hasMore: rows.length > limit };
}

export async function findAdminMediaByIds(ids: string[]): Promise<MediaAssetOption[]> {
  if (!ids.length) return [];
  const db = await database();
  const rows = await db.select({
    id: mediaAssets.id, publicUrl: mediaAssets.publicUrl, altText: mediaAssets.altText,
    storageKey: mediaAssets.storageKey, width: mediaAssets.width, height: mediaAssets.height,
  }).from(mediaAssets)
    .where(and(inArray(mediaAssets.id, ids), like(mediaAssets.mimeType, "image/%"), isNotNull(mediaAssets.publicUrl)));
  return rows.map(toMediaOption).filter((option): option is MediaAssetOption => option !== null);
}

export function articleMediaIds(input: ArticleMutation): string[] {
  return collectArticleMediaReferences({ ...input, blocks: input.contentDocument.blocks }).ids;
}

export async function articleMediaExists(input: ArticleMutation): Promise<boolean> {
  const references = collectArticleMediaReferences({ ...input, blocks: input.contentDocument.blocks });
  if (!references.valid) return false;
  const ids = references.ids;
  if (!ids.length) return true;
  const found = await findAdminMediaByIds(ids);
  return found.length === ids.length;
}

export async function findAdminArticle(id: string) {
  const db = await database();
  const [article] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!article) return null;
  const [category] = await db
    .select({ categoryId: postCategories.categoryId })
    .from(postCategories)
    .where(eq(postCategories.postId, id))
    .limit(1);
  const tagRows = await db.select({ tagId: postTags.tagId }).from(postTags).where(eq(postTags.postId, id));
  return { ...article, categoryId: category?.categoryId ?? null, tagIds: tagRows.map((row) => row.tagId) };
}

export async function listAdminArticleRevisions(id: string) {
  const db = await database();
  const rows = await db.select({
    revisionNumber: postRevisions.revisionNumber,
    changeSummary: postRevisions.changeSummary,
    createdAt: postRevisions.createdAt,
    editorName: users.displayName,
  }).from(postRevisions)
    .leftJoin(users, eq(postRevisions.editorId, users.id))
    .where(eq(postRevisions.postId, id))
    .orderBy(desc(postRevisions.revisionNumber))
    .limit(10);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function listAdminArticleRedirects(id: string) {
  const db = await database();
  const rows = await db.select({ sourceSlug: postRedirects.sourceSlug, createdAt: postRedirects.createdAt })
    .from(postRedirects).where(eq(postRedirects.postId, id))
    .orderBy(desc(postRedirects.createdAt)).limit(25);
  return rows.map((row) => ({ sourceSlug: row.sourceSlug, createdAt: row.createdAt.toISOString() }));
}

export async function restoreAdminArticleRevision(id: string, revisionNumber: number, actorId: string) {
  const db = await database();
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!existing) return null;
    const [targetRevision] = await tx.select({ snapshot: postRevisions.snapshot })
      .from(postRevisions).where(and(eq(postRevisions.postId, id), eq(postRevisions.revisionNumber, revisionNumber))).limit(1);
    const parsedTarget = parseArticleRevisionSnapshot(targetRevision?.snapshot);
    if (!parsedTarget.success) throw new Error("INVALID_REVISION_SNAPSHOT");
    const target: ArticleMutation = { ...parsedTarget.data, slug: existing.slug, newTagNames: [] };

    const references = collectArticleMediaReferences({ ...target, blocks: target.contentDocument.blocks });
    if (!references.valid) throw new Error("INVALID_REVISION_MEDIA");
    if (references.ids.length) {
      const mediaRows = await tx.select({ id: mediaAssets.id }).from(mediaAssets).where(inArray(mediaAssets.id, references.ids));
      if (mediaRows.length !== references.ids.length) throw new Error("MISSING_REVISION_MEDIA");
    }

    const [currentCategory] = await tx.select({ categoryId: postCategories.categoryId })
      .from(postCategories).where(eq(postCategories.postId, id)).limit(1);
    const currentTags = await tx.select({ tagId: postTags.tagId }).from(postTags).where(eq(postTags.postId, id));
    const currentSnapshot = parseArticleRevisionSnapshot({
      title: existing.title, slug: existing.slug, excerpt: existing.excerpt ?? "",
      status: existing.status,
      scheduledFor: existing.status === "scheduled" ? existing.scheduledFor?.toISOString() ?? null : null,
      headerTemplate: existing.headerTemplate, articleTemplate: existing.articleTemplate ?? "longform",
      categoryId: currentCategory?.categoryId ?? null, featuredMediaId: existing.featuredMediaId,
      secondaryMediaId: existing.secondaryMediaId, seoTitle: existing.seoTitle ?? "",
      seoDescription: existing.seoDescription ?? "", tagIds: currentTags.map((row) => row.tagId),
      newTagNames: [], contentDocument: existing.contentDocument,
    });
    if (!currentSnapshot.success) throw new Error("INVALID_CURRENT_ARTICLE");
    const [latestRevision] = await tx.select({ revisionNumber: postRevisions.revisionNumber })
      .from(postRevisions).where(eq(postRevisions.postId, id)).orderBy(desc(postRevisions.revisionNumber)).limit(1);
    const checkpointNumber = (latestRevision?.revisionNumber ?? 0) + 1;
    await tx.insert(postRevisions).values({ id: randomUUID(), postId: id, editorId: actorId,
      revisionNumber: checkpointNumber, snapshot: currentSnapshot.data,
      changeSummary: `Checkpoint before restoring revision #${revisionNumber}` });

    const tagIds = await resolveArticleTagIds(tx, target);
    await tx.update(posts).set({
      title: target.title, slug: existing.slug, excerpt: target.excerpt || null, status: target.status,
      headerTemplate: target.headerTemplate, articleTemplate: target.articleTemplate,
      contentDocument: target.contentDocument, featuredMediaId: target.featuredMediaId,
      secondaryMediaId: target.secondaryMediaId, seoTitle: target.seoTitle || null,
      seoDescription: target.seoDescription || null,
      publishedAt: target.status === "published" ? existing.publishedAt ?? new Date() : null,
      scheduledFor: target.status === "scheduled" && target.scheduledFor ? new Date(target.scheduledFor) : null,
    }).where(eq(posts.id, id));
    await tx.delete(postCategories).where(eq(postCategories.postId, id));
    if (target.categoryId) await tx.insert(postCategories).values({ postId: id, categoryId: target.categoryId });
    await tx.delete(postTags).where(eq(postTags.postId, id));
    if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
    await tx.insert(postRevisions).values({ id: randomUUID(), postId: id, editorId: actorId,
      revisionNumber: checkpointNumber + 1, snapshot: target,
      changeSummary: `Restored revision #${revisionNumber}` });
    await tx.insert(auditEvents).values({ id: randomUUID(), actorId, action: "article.revision_restored",
      entityType: "post", entityId: id, metadata: { restoredRevision: revisionNumber,
        checkpointRevision: checkpointNumber, resultingRevision: checkpointNumber + 1, slugPreserved: true } });

    const categoryIds = [...new Set([currentCategory?.categoryId, target.categoryId]
      .filter((categoryId): categoryId is string => Boolean(categoryId)))];
    const categorySlugs = categoryIds.length ? (await tx.select({ slug: categories.slug }).from(categories)
      .where(inArray(categories.id, categoryIds))).map((row) => row.slug) : [];
    return { slug: existing.slug, categorySlugs };
  });
}

export async function createAdminArticle(input: ArticleMutation, actorId: string) {
  const db = await database();
  const id = randomUUID();
  const now = new Date();
  await db.transaction(async (tx) => {
    const [redirectCollision] = await tx.select({ postId: postRedirects.postId }).from(postRedirects)
      .where(eq(postRedirects.sourceSlug, input.slug)).limit(1);
    if (redirectCollision) throw new Error("ARTICLE_REDIRECT_COLLISION");
    const tagIds = await resolveArticleTagIds(tx, input);
    await tx.insert(posts).values({
      id,
      authorId: actorId,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt || null,
      status: input.status,
      scheduledFor: input.status === "scheduled" && input.scheduledFor ? new Date(input.scheduledFor) : null,
      headerTemplate: input.headerTemplate,
      articleTemplate: input.articleTemplate,
      contentDocument: input.contentDocument,
      featuredMediaId: input.featuredMediaId,
      secondaryMediaId: input.secondaryMediaId,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      publishedAt: input.status === "published" ? now : null,
    });
    if (input.categoryId) {
      await tx.insert(postCategories).values({ postId: id, categoryId: input.categoryId });
    }
    if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
    await tx.insert(postRevisions).values({
      id: randomUUID(), postId: id, editorId: actorId, revisionNumber: 1,
      snapshot: input, changeSummary: "Initial article creation",
    });
    await tx.insert(auditEvents).values({
      id: randomUUID(), actorId, action: "article.created", entityType: "post", entityId: id,
      metadata: { status: input.status, slug: input.slug, tagCount: tagIds.length },
    });
  });
  const categorySlugs = input.categoryId
    ? (await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, input.categoryId)).limit(1)).map((row) => row.slug)
    : [];
  return { id, slug: input.slug, categorySlugs };
}

export async function resolveAvailableArticleSlug(base: string): Promise<string> {
  const db = await database();
  for (let suffix = 1; suffix <= 1000; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base.slice(0, 191 - String(suffix).length - 1).replace(/-+$/g, "")}-${suffix}`;
    const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, candidate)).limit(1);
    const [redirect] = await db.select({ id: postRedirects.id }).from(postRedirects)
      .where(eq(postRedirects.sourceSlug, candidate)).limit(1);
    if (!existing && !redirect) return candidate;
  }
  throw new Error("No available article slug.");
}

export async function updateAdminArticle(id: string, input: ArticleMutation, actorId: string) {
  const db = await database();
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!existing) return null;
    const slugChanged = input.slug !== existing.slug;
    if (slugChanged) {
      const [postCollision] = await tx.select({ id: posts.id }).from(posts).where(eq(posts.slug, input.slug)).limit(1);
      if (postCollision && postCollision.id !== id) throw new Error("ARTICLE_SLUG_COLLISION");
      const [redirectCollision] = await tx.select({ postId: postRedirects.postId })
        .from(postRedirects).where(eq(postRedirects.sourceSlug, input.slug)).limit(1);
      if (assertRedirectOwnership(redirectCollision?.postId, id)) {
        await tx.delete(postRedirects).where(eq(postRedirects.sourceSlug, input.slug));
      }
      if (needsPublishedSlugRedirect(existing.status, existing.slug, input.slug)) {
        const [oldRedirect] = await tx.select({ postId: postRedirects.postId })
          .from(postRedirects).where(eq(postRedirects.sourceSlug, existing.slug)).limit(1);
        assertRedirectOwnership(oldRedirect?.postId, id);
        if (!oldRedirect) await tx.insert(postRedirects).values({ id: randomUUID(), postId: id,
          sourceSlug: existing.slug, createdBy: actorId });
      }
    }
    const [previousCategory] = await tx.select({ categoryId: postCategories.categoryId })
      .from(postCategories).where(eq(postCategories.postId, id)).limit(1);
    const [latestRevision] = await tx
      .select({ revisionNumber: postRevisions.revisionNumber })
      .from(postRevisions)
      .where(eq(postRevisions.postId, id))
      .orderBy(desc(postRevisions.revisionNumber))
      .limit(1);
    const tagIds = await resolveArticleTagIds(tx, input);
    await tx.update(posts).set({
      title: input.title, slug: input.slug, excerpt: input.excerpt || null,
      status: input.status, headerTemplate: input.headerTemplate,
      articleTemplate: input.articleTemplate, contentDocument: input.contentDocument,
      featuredMediaId: input.featuredMediaId, secondaryMediaId: input.secondaryMediaId,
      seoTitle: input.seoTitle || null, seoDescription: input.seoDescription || null,
      publishedAt: input.status === "published" ? existing.publishedAt ?? new Date() : null,
      scheduledFor: input.status === "scheduled" && input.scheduledFor ? new Date(input.scheduledFor) : null,
    }).where(eq(posts.id, id));
    await tx.delete(postCategories).where(eq(postCategories.postId, id));
    if (input.categoryId) {
      await tx.insert(postCategories).values({ postId: id, categoryId: input.categoryId });
    }
    await tx.delete(postTags).where(eq(postTags.postId, id));
    if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
    await tx.insert(postRevisions).values({
      id: randomUUID(), postId: id, editorId: actorId,
      revisionNumber: (latestRevision?.revisionNumber ?? 0) + 1,
      snapshot: input, changeSummary: `Updated from ${existing.status} to ${input.status}`,
    });
    await tx.insert(auditEvents).values({
      id: randomUUID(), actorId, action: "article.updated", entityType: "post", entityId: id,
      metadata: { previousStatus: existing.status, status: input.status, previousSlug: existing.slug,
        slug: input.slug, redirectCreated: needsPublishedSlugRedirect(existing.status, existing.slug, input.slug), tagCount: tagIds.length },
    });
    const categoryIds = [...new Set([previousCategory?.categoryId, input.categoryId]
      .filter((categoryId): categoryId is string => Boolean(categoryId)))];
    const categorySlugs = categoryIds.length
      ? (await tx.select({ slug: categories.slug }).from(categories)
        .where(inArray(categories.id, categoryIds))).map((row) => row.slug)
      : [];
    return { existing, slug: input.slug,
      redirectFrom: needsPublishedSlugRedirect(existing.status, existing.slug, input.slug) ? existing.slug : null,
      categorySlugs };
  });
}
