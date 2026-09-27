import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { publicationCacheTags } from "./cache-tags";
import { createPublicationRepository } from "./repositories";

export const getCachedPublishedPost = cache(async (slug: string) =>
  unstable_cache(
    () => createPublicationRepository().findPublishedBySlug(slug),
    ["published-post", slug],
    { revalidate: 300, tags: [publicationCacheTags.post(slug)] },
  )(),
);

export const getCachedPublishedRedirect = cache(async (slug: string) =>
  unstable_cache(
    () => createPublicationRepository().findPublishedRedirectBySlug(slug),
    ["published-post-redirect", slug],
    { revalidate: 300, tags: [publicationCacheTags.post(slug)] },
  )(),
);

export async function getCachedCategoryPosts(slug: string, offset: number, limit: number, sort: "related" | "recent" | "oldest" = "related") {
  return unstable_cache(
    () => createPublicationRepository().listPublishedByCategory(slug, { offset, limit, sort }),
    ["published-category-v3", slug, sort, String(offset), String(limit)],
    { revalidate: 300, tags: [publicationCacheTags.category(slug)] },
  )();
}

export async function getCachedCategoryPostCount(slug: string) {
  return unstable_cache(
    () => createPublicationRepository().countPublishedByCategory(slug),
    ["published-category-count", slug],
    { revalidate: 300, tags: [publicationCacheTags.category(slug)] },
  )();
}

export async function getCachedHomepageHeroPosts() {
  return unstable_cache(
    () => createPublicationRepository().listLatestHeroPublished(),
    // Versioned after expanding the source window to seven records; this
    // prevents an older five-record cache from leaving only three slides
    // after the first two spam entries are omitted.
    ["published-homepage-hero-v4"],
    { revalidate: 300, tags: [publicationCacheTags.all, publicationCacheTags.latest] },
  )();
}

export async function getCachedPublicSearch(input: {
  query: string;
  categorySlug: string | null;
  offset: number;
  limit: number;
}) {
  return unstable_cache(
    () => createPublicationRepository().searchPublished(input),
    ["published-search", input.query.toLocaleLowerCase("el-GR"), input.categorySlug ?? "all", String(input.offset), String(input.limit)],
    { revalidate: 300, tags: [publicationCacheTags.all] },
  )();
}

export async function getCachedSyndicationPosts(input: { limit: number; since?: Date }) {
  return unstable_cache(
    () => createPublicationRepository().listPublishedForSyndication(input),
    ["published-syndication-v1", String(input.limit), input.since?.toISOString() ?? "all"],
    { revalidate: 300, tags: [publicationCacheTags.all, publicationCacheTags.feed, publicationCacheTags.news] },
  )();
}
