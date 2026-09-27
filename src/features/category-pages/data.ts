import "server-only";

import type { DemoStory } from "@/content/demo-home";
import { homeSections, voicesFeature } from "@/content/demo-home";
import { categoryPageBySlug } from "./catalog";
import { toIsoDate } from "@/features/publication/date-utils";
import type { CategorySort } from "./sorting";
import { isExcludedImportedTitle } from "@/features/publication/excluded-imported-content";

export const CATEGORY_PAGE_SIZE = 12;

const previewPool = [voicesFeature, ...homeSections.latest, ...homeSections.development, ...homeSections.voices];

function previewStories(slug: string): DemoStory[] {
  const category = categoryPageBySlug(slug);
  if (!category) return [];
  return previewPool.map((story, index) => ({
    ...story,
    category: category.name,
    slug: `${slug}-${story.slug}`,
    href: "/article-preview?template=longform",
    artwork: previewPool[(index + category.name.length) % previewPool.length]?.artwork ?? story.artwork,
  }));
}

export async function getCategoryStories(slug: string, offset = 0, limit = CATEGORY_PAGE_SIZE, sort: CategorySort = "related"): Promise<DemoStory[]> {
  if (!categoryPageBySlug(slug)) return [];
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") {
    const stories = previewStories(slug);
    const ordered = sort === "oldest" ? [...stories].reverse() : stories;
    return ordered.slice(offset, offset + limit);
  }

  const [{ createPublicationRepository }, { getCachedCategoryPosts }] = await Promise.all([
    import("@/features/publication/repositories"), import("@/features/publication/cached-data"),
  ]);
  const repository = createPublicationRepository();
  const rows = (await getCachedCategoryPosts(categoryPageBySlug(slug)?.legacySlug ?? slug, offset, limit + 4, sort))
    .filter((row) => !isExcludedImportedTitle(row.title)).slice(0, limit);
  const mediaIds = [...new Set(rows.map((row) => row.featuredMediaId).filter((id): id is string => Boolean(id)))];
  const media = await repository.findPublicMediaByIds(mediaIds);
  const artwork = ["pitch", "strategy", "portrait", "tournament"] as const;
  return rows.map((row, index) => ({
    slug: row.slug,
    category: categoryPageBySlug(slug)?.name ?? "Ακαδημίες",
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    author: row.authorName ?? "Ακαδημίες Editorial",
    readingTime: "Άρθρο",
    artwork: artwork[(offset + index) % artwork.length] ?? "pitch",
    imageAlt: row.title,
    imageUrl: media.find((asset) => asset.id === row.featuredMediaId)?.url,
    href: `/posts/${row.slug}`,
    publishedAt: toIsoDate(row.publishedAt),
  }));
}

export async function getCategoryStoryCount(slug: string): Promise<number> {
  const category = categoryPageBySlug(slug);
  if (!category) return 0;
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") return previewStories(slug).length;
  const { getCachedCategoryPostCount } = await import("@/features/publication/cached-data");
  return getCachedCategoryPostCount(category.legacySlug ?? slug);
}
