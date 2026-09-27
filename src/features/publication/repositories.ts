import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, like, lt, lte, ne, notInArray, notLike, or, sql } from "drizzle-orm";
import { db, type Database } from "@/db";
import { categories, mediaAssets, postCategories, postDailyViews, postRedirects, posts, postTags, tags, users } from "@/db/schema";
import { canReadEditorialContent, type EditorialRole } from "./contracts";
import { safePublicMediaUrl } from "@/features/admin-articles/media-contracts";
import { legacyCanonicalCandidates } from "./legacy-routing";

const publicArticleSelection = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  contentDocument: posts.contentDocument,
  sanitizedLegacyHtml: posts.sanitizedLegacyHtml,
  headerTemplate: posts.headerTemplate,
  articleTemplate: posts.articleTemplate,
  featuredMediaId: posts.featuredMediaId,
  secondaryMediaId: posts.secondaryMediaId,
  publishedAt: posts.publishedAt,
  seoTitle: posts.seoTitle,
  seoDescription: posts.seoDescription,
  canonicalUrl: posts.canonicalUrl,
  updatedAt: posts.updatedAt,
  authorId: users.id,
  authorUsername: users.username,
  authorName: users.displayName,
};

type PublicArticleRow = Pick<typeof posts.$inferSelect,
  "id" | "slug" | "title" | "excerpt" | "contentDocument" | "sanitizedLegacyHtml" |
  "headerTemplate" | "articleTemplate" | "featuredMediaId" | "secondaryMediaId" | "publishedAt" |
  "seoTitle" | "seoDescription" | "canonicalUrl" | "updatedAt"> & {
    authorId: string | null; authorUsername: string | null; authorName: string | null;
  };

function availablePublicMediaUrl(input: string | null): string | null {
  const url = safePublicMediaUrl(input);
  if (!url || !url.startsWith("/")) return url;
  const publicRoot = resolve(process.cwd(), "public");
  const filePath = resolve(publicRoot, `.${url}`);
  return filePath.startsWith(`${publicRoot}${sep}`) && existsSync(filePath) ? url : null;
}

export function createPublicationRepository(database: Database = db) {
  return {
    async findPublicMediaByIds(ids: string[]) {
      if (!ids.length) return [];
      const rows = await database.select({ id: mediaAssets.id, publicUrl: mediaAssets.publicUrl, alt: mediaAssets.altText,
        width: mediaAssets.width, height: mediaAssets.height }).from(mediaAssets)
        .where(and(inArray(mediaAssets.id, ids), like(mediaAssets.mimeType, "image/%"), isNotNull(mediaAssets.publicUrl)));
      return rows.flatMap((row) => {
        const url = availablePublicMediaUrl(row.publicUrl);
        return url ? [{ id: row.id, url, alt: row.alt ?? "", width: row.width, height: row.height }] : [];
      });
    },
    async findPublishedBySlug(slug: string, now = new Date()) {
      const rows = await database
        .select(publicArticleSelection)
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.slug, slug),
            eq(posts.status, "published"),
            isNotNull(posts.publishedAt),
            lte(posts.publishedAt, now),
          ),
        )
        .limit(1);

      return rows[0] ?? null;
    },
    async findArticleCategory(postId: string) {
      const rows = await database.select({ name: categories.name, slug: categories.slug }).from(postCategories)
        .innerJoin(categories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, postId)).orderBy(asc(postCategories.position)).limit(1);
      return rows[0] ?? null;
    },
    async findArticleTags(postId: string) {
      return database.select({ name: tags.name, slug: tags.slug }).from(postTags)
        .innerJoin(tags, eq(tags.id, postTags.tagId)).where(eq(postTags.postId, postId))
        .orderBy(asc(tags.name)).limit(20);
    },
    async findPublishedRedirectBySlug(sourceSlug: string, now = new Date()) {
      const rows = await database.select({ slug: posts.slug }).from(postRedirects)
        .innerJoin(posts, eq(postRedirects.postId, posts.id))
        .where(and(eq(postRedirects.sourceSlug, sourceSlug), eq(posts.status, "published"),
          isNotNull(posts.publishedAt), lte(posts.publishedAt, now))).limit(1);
      return rows[0] ?? null;
    },
    async findGoldenCupDemoBySlug(slug: string) {
      if (!slug.startsWith("demo-27o-golden-cup-2027-")) return null;
      const rows = await database.select(publicArticleSelection).from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(and(eq(posts.slug, slug), like(posts.slug, "demo-27o-golden-cup-2027-%")))
        .limit(1);
      return rows[0] ?? null;
    },

    async listRelatedPublished(postId: string, input?: { limit?: number; keyword?: string; now?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 5, 1), 10);
      const now = input?.now ?? new Date();
      const visibility = and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now));
      const [tagRows, categoryRows] = await Promise.all([
        database.select({ id: postTags.tagId }).from(postTags).where(eq(postTags.postId, postId)),
        database.select({ id: postCategories.categoryId }).from(postCategories).where(eq(postCategories.postId, postId)),
      ]);
      const result: PublicArticleRow[] = [];
      const addUnique = (items: PublicArticleRow[]) => {
        for (const item of items) if (item.id !== postId && !result.some((existing) => existing.id === item.id) && result.length < limit) result.push(item);
      };
      if (tagRows.length) addUnique(await database.selectDistinct(publicArticleSelection).from(posts)
        .innerJoin(postTags, eq(postTags.postId, posts.id)).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), inArray(postTags.tagId, tagRows.map(({ id }) => id))))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit));
      const keyword = input?.keyword?.trim();
      if (result.length < limit && keyword) addUnique(await database.select(publicArticleSelection).from(posts)
        .leftJoin(users, eq(posts.authorId, users.id)).where(and(visibility, ne(posts.id, postId),
          or(like(posts.title, `%${keyword}%`), like(posts.excerpt, `%${keyword}%`)),
          ...(result.length ? [notInArray(posts.id, result.map(({ id }) => id))] : [])))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit - result.length));
      if (result.length < limit && categoryRows.length) addUnique(await database.selectDistinct(publicArticleSelection).from(posts)
        .innerJoin(postCategories, eq(postCategories.postId, posts.id)).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), inArray(postCategories.categoryId, categoryRows.map(({ id }) => id)),
          ...(result.length ? [notInArray(posts.id, result.map(({ id }) => id))] : [])))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit - result.length));
      if (result.length < limit) addUnique(await database.select(publicArticleSelection).from(posts).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), ...(result.length ? [notInArray(posts.id, result.map(({ id }) => id))] : [])))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit - result.length));
      return result;
    },

    async findGoldenCupDemoContext(postId: string) {
      const rows = await database.select(publicArticleSelection).from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(like(posts.slug, "demo-27o-golden-cup-2027-%"))
        .orderBy(sql`field(${posts.articleTemplate}, 'longform', 'matchday', 'gallery', 'interview', 'cinematic', 'chess', 'sidebar')`);
      const index = rows.findIndex((row) => row.id === postId);
      if (index < 0 || rows.length < 2) return { previous: null, next: null };
      return { previous: rows[(index - 1 + rows.length) % rows.length] ?? null,
        next: rows[(index + 1) % rows.length] ?? null };
    },

    async findPublishedArticleContext(postId: string, publishedAt: Date, now = new Date()) {
      const visibility = and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now));
      const [olderRows, newerRows, categoryRows, tagRows] = await Promise.all([
        database.select(publicArticleSelection).from(posts).leftJoin(users, eq(posts.authorId, users.id))
          .where(and(visibility, lt(posts.publishedAt, publishedAt))).orderBy(desc(posts.publishedAt), desc(posts.id)).limit(1),
        database.select(publicArticleSelection).from(posts).leftJoin(users, eq(posts.authorId, users.id))
          .where(and(visibility, gt(posts.publishedAt, publishedAt))).orderBy(asc(posts.publishedAt), asc(posts.id)).limit(1),
        database.select({ id: postCategories.categoryId }).from(postCategories).where(eq(postCategories.postId, postId)),
        database.select({ id: postTags.tagId }).from(postTags).where(eq(postTags.postId, postId)),
      ]);
      const related: Array<(typeof olderRows)[number]> = [];
      const addUnique = (rows: Array<(typeof olderRows)[number]>) => {
        for (const row of rows) if (row.id !== postId && !related.some((item) => item.id === row.id) && related.length < 5) related.push(row);
      };
      if (categoryRows.length) addUnique(await database.selectDistinct(publicArticleSelection).from(posts)
        .innerJoin(postCategories, eq(postCategories.postId, posts.id)).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), inArray(postCategories.categoryId, categoryRows.map(({ id }) => id))))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(5));
      if (related.length < 5 && tagRows.length) addUnique(await database.selectDistinct(publicArticleSelection).from(posts)
        .innerJoin(postTags, eq(postTags.postId, posts.id)).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), notInArray(posts.id, related.map(({ id }) => id)), inArray(postTags.tagId, tagRows.map(({ id }) => id))))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(5 - related.length));
      if (related.length < 5) addUnique(await database.select(publicArticleSelection).from(posts).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, ne(posts.id, postId), ...(related.length ? [notInArray(posts.id, related.map(({ id }) => id))] : [])))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(5 - related.length));
      return { previous: olderRows[0] ?? null, next: newerRows[0] ?? null, related };
    },

    async listLatestPublished(input?: { limit?: number; now?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const now = input?.now ?? new Date();

      return database
        .select(publicArticleSelection)
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.status, "published"),
            isNotNull(posts.publishedAt),
            lte(posts.publishedAt, now),
          ),
        )
        .orderBy(desc(posts.publishedAt), desc(posts.id))
        .limit(limit);
    },

    async listPublishedByAuthor(username: string, input?: { offset?: number; limit?: number; now?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const offset = Math.max(input?.offset ?? 0, 0);
      const now = input?.now ?? new Date();
      return database.select(publicArticleSelection).from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(and(eq(users.username, username), eq(users.isActive, true), eq(posts.status, "published"),
          isNotNull(posts.publishedAt), lte(posts.publishedAt, now), notLike(posts.slug, "demo-%")))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit).offset(offset);
    },

    async countPublishedByAuthor(username: string, now = new Date()) {
      const [row] = await database.select({ total: sql<number>`count(*)` }).from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(and(eq(users.username, username), eq(users.isActive, true), eq(posts.status, "published"),
          isNotNull(posts.publishedAt), lte(posts.publishedAt, now), notLike(posts.slug, "demo-%")));
      return Number(row?.total ?? 0);
    },

    async listMostViewedPublished(input?: { limit?: number; days?: number; now?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 5, 1), 20);
      const days = Math.min(Math.max(input?.days ?? 30, 1), 365);
      const now = input?.now ?? new Date();
      const since = new Date(now);
      since.setUTCDate(since.getUTCDate() - days + 1);
      const sinceDate = since.toISOString().slice(0, 10);
      const rankings = database.select({ postId: postDailyViews.postId,
        views: sql<number>`sum(${postDailyViews.views})`.as("views") })
        .from(postDailyViews).where(gte(postDailyViews.viewDate, sinceDate))
        .groupBy(postDailyViews.postId).as("recent_views");
      return database.select({ ...publicArticleSelection, views: rankings.views }).from(posts)
        .innerJoin(rankings, eq(rankings.postId, posts.id)).leftJoin(users, eq(posts.authorId, users.id))
        .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now)))
        .orderBy(desc(rankings.views), desc(posts.publishedAt), desc(posts.id)).limit(limit);
    },

    async recordPublishedView(slug: string, now = new Date()) {
      if (!/^[a-z0-9-]{1,191}$/i.test(slug)) return false;
      const [post] = await database.select({ id: posts.id }).from(posts).where(and(
        eq(posts.slug, slug), eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
      )).limit(1);
      if (!post) return false;
      const viewDate = now.toISOString().slice(0, 10);
      await database.insert(postDailyViews).values({ postId: post.id, viewDate, views: 1 })
        .onDuplicateKeyUpdate({ set: { views: sql`${postDailyViews.views} + 1` } });
      return true;
    },

    async listPublishedForSitemap(now = new Date()) {
      return database.select({ slug: posts.slug, updatedAt: posts.updatedAt, imageUrl: mediaAssets.publicUrl })
        .from(posts).leftJoin(mediaAssets, eq(posts.featuredMediaId, mediaAssets.id))
        .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
          notLike(posts.slug, "demo-%")))
        .orderBy(desc(posts.updatedAt)).limit(50_000);
    },

    async listPublishedForSyndication(input?: { limit?: number; now?: Date; since?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 50, 1), 1000);
      const now = input?.now ?? new Date();
      const rows = await database.selectDistinct({ id: posts.id, slug: posts.slug, title: posts.title,
        excerpt: posts.excerpt, seoDescription: posts.seoDescription, canonicalUrl: posts.canonicalUrl,
        publishedAt: posts.publishedAt, updatedAt: posts.updatedAt, authorName: users.displayName,
        categoryName: categories.name, imageUrl: mediaAssets.publicUrl, imageAlt: mediaAssets.altText,
        mimeType: mediaAssets.mimeType }).from(posts)
        .innerJoin(mediaAssets, eq(posts.featuredMediaId, mediaAssets.id))
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(postCategories, eq(postCategories.postId, posts.id))
        .leftJoin(categories, eq(categories.id, postCategories.categoryId))
        .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
          input?.since ? gte(posts.publishedAt, input.since) : undefined,
          isNotNull(mediaAssets.publicUrl), like(mediaAssets.mimeType, "image/%"), notLike(posts.slug, "demo-%")))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(limit);
      return rows.flatMap((row) => {
        const imageUrl = availablePublicMediaUrl(row.imageUrl);
        return imageUrl && row.publishedAt ? [{ ...row, imageUrl, publishedAt: row.publishedAt }] : [];
      });
    },

    async findPublishedByLegacySlug(legacySlug: string, now = new Date()) {
      const paths = legacyCanonicalCandidates(legacySlug);
      if (!paths.length) return null;
      const rows = await database.select({ slug: posts.slug }).from(posts).where(and(
        inArray(posts.legacyUrl, paths), eq(posts.status, "published"),
        isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
      )).limit(1);
      return rows[0] ?? null;
    },

    async findPublishedByLegacyId(legacyId: number, now = new Date()) {
      if (!Number.isSafeInteger(legacyId) || legacyId < 1) return null;
      const rows = await database.select({ slug: posts.slug }).from(posts).where(and(
        eq(posts.legacyWordPressId, legacyId), eq(posts.status, "published"),
        isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
      )).limit(1);
      return rows[0] ?? null;
    },

    async listLatestHeroPublished(now = new Date()) {
      return database
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          excerpt: posts.excerpt,
          publishedAt: posts.publishedAt,
          authorName: users.displayName,
          imageUrl: mediaAssets.publicUrl,
          imageAlt: mediaAssets.altText,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(mediaAssets, eq(posts.featuredMediaId, mediaAssets.id))
        .where(
          and(
            eq(posts.status, "published"),
            isNotNull(posts.publishedAt),
            lte(posts.publishedAt, now),
            notLike(posts.slug, "demo-%"),
          ),
        )
        .orderBy(desc(posts.publishedAt), desc(posts.id))
        // Fetch a wider window because the homepage omits explicitly
        // excluded imported editorial records after the public query.
        .limit(12);
    },

    async listPublishedByCategory(
      categorySlug: string,
      input?: { limit?: number; offset?: number; now?: Date; sort?: "related" | "recent" | "oldest" },
    ) {
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const offset = Math.min(Math.max(input?.offset ?? 0, 0), 100_000);
      const now = input?.now ?? new Date();
      const sort = input?.sort ?? "related";

      return database
        .select(publicArticleSelection)
        .from(posts)
        .innerJoin(postCategories, eq(postCategories.postId, posts.id))
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(categories.slug, categorySlug),
            eq(posts.status, "published"),
            isNotNull(posts.publishedAt),
            lte(posts.publishedAt, now),
          ),
        )
        .orderBy(...(sort === "oldest"
          ? [asc(posts.publishedAt), asc(posts.id)]
          : sort === "recent"
            ? [desc(posts.publishedAt), desc(posts.id)]
            : [asc(postCategories.position), desc(posts.publishedAt), desc(posts.id)]))
        .offset(offset)
        .limit(limit);
    },

    async countPublishedByCategory(categorySlug: string, now = new Date()) {
      const rows = await database
        .select({ total: sql<number>`count(distinct ${posts.id})` })
        .from(posts)
        .innerJoin(postCategories, eq(postCategories.postId, posts.id))
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(and(
          eq(categories.slug, categorySlug),
          eq(posts.status, "published"),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now),
        ));
      return Number(rows[0]?.total ?? 0);
    },

    async findPublicTopic(slug: string, now = new Date()) {
      const [row] = await database.select({ id: tags.id, name: tags.name, slug: tags.slug,
        total: sql<number>`count(distinct ${posts.id})` }).from(tags)
        .innerJoin(postTags, eq(postTags.tagId, tags.id)).innerJoin(posts, eq(posts.id, postTags.postId))
        .where(and(eq(tags.slug, slug), eq(posts.status, "published"), isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now), notLike(posts.slug, "demo-%"))).groupBy(tags.id, tags.name, tags.slug).limit(1);
      return row ? { ...row, total: Number(row.total) } : null;
    },

    async listPublishedByTopic(slug: string, input?: { offset?: number; limit?: number; now?: Date }) {
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const offset = Math.min(Math.max(input?.offset ?? 0, 0), 100_000);
      const now = input?.now ?? new Date();
      return database.select(publicArticleSelection).from(posts)
        .innerJoin(postTags, eq(postTags.postId, posts.id)).innerJoin(tags, eq(tags.id, postTags.tagId))
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(and(eq(tags.slug, slug), eq(posts.status, "published"), isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now), notLike(posts.slug, "demo-%")))
        .orderBy(desc(posts.publishedAt), desc(posts.id)).offset(offset).limit(limit);
    },

    async listPublicTopicsForSitemap(now = new Date()) {
      return database.select({ slug: tags.slug, updatedAt: sql<Date>`max(${posts.updatedAt})` }).from(tags)
        .innerJoin(postTags, eq(postTags.tagId, tags.id)).innerJoin(posts, eq(posts.id, postTags.postId))
        .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now),
          notLike(posts.slug, "demo-%"))).groupBy(tags.id, tags.slug).orderBy(asc(tags.slug)).limit(10_000);
    },

    async searchPublished(input: { query: string; categorySlug: string | null; offset: number; limit: number; now?: Date }) {
      const query = input.query.trim().slice(0, 100);
      if (query.length < 2) return [];
      const offset = Math.min(Math.max(input.offset, 0), 9_000);
      const limit = Math.min(Math.max(input.limit, 1), 50);
      const now = input.now ?? new Date();
      const escaped = query.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
      const pattern = `%${escaped}%`;
      const booleanQuery = query.match(/[\p{L}\p{N}]{2,}/gu)?.map((term) => `+${term}*`).join(" ") ?? "";
      const visibility = and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now));
      const matches = or(
        booleanQuery ? sql<boolean>`match(${posts.title}, ${posts.excerpt}, ${posts.sanitizedLegacyHtml}) against (${booleanQuery} in boolean mode)` : undefined,
        like(sql<string>`cast(${posts.contentDocument} as char)`, pattern),
      );
      const ranking = booleanQuery
        ? sql<number>`match(${posts.title}, ${posts.excerpt}, ${posts.sanitizedLegacyHtml}) against (${booleanQuery} in boolean mode)`
        : sql<number>`0`;

      if (input.categorySlug) {
        return database.selectDistinct(publicArticleSelection).from(posts)
          .innerJoin(postCategories, eq(postCategories.postId, posts.id))
          .innerJoin(categories, eq(postCategories.categoryId, categories.id))
          .leftJoin(users, eq(posts.authorId, users.id))
          .where(and(visibility, eq(categories.slug, input.categorySlug), matches))
          .orderBy(desc(ranking), desc(posts.publishedAt), desc(posts.id)).offset(offset).limit(limit);
      }

      return database.select(publicArticleSelection).from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(and(visibility, matches))
        .orderBy(desc(ranking), desc(posts.publishedAt), desc(posts.id)).offset(offset).limit(limit);
    },
  };
}

export function createEditorialRepository(
  role: EditorialRole,
  database: Database = db,
) {
  if (!canReadEditorialContent(role)) {
    throw new Error("Editorial access is required.");
  }

  return {
    async findById(id: string) {
      const rows = await database.select().from(posts).where(eq(posts.id, id)).limit(1);
      return rows[0] ?? null;
    },
  };
}
