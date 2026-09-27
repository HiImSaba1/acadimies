import "server-only";

import type { DemoStory } from "@/content/demo-home";
import { homeSections, voicesFeature } from "@/content/demo-home";
import { categoryPageBySlug } from "@/features/category-pages/catalog";
import { canRunPublicSearch, SEARCH_PAGE_SIZE, type PublicSearchQuery } from "./contracts";

export type PublicSearchResult = { stories: DemoStory[]; hasNext: boolean };

const previewStories = [voicesFeature, ...homeSections.latest, ...homeSections.development, ...homeSections.voices];

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR");
}

export async function searchPublicStories(input: PublicSearchQuery): Promise<PublicSearchResult> {
  if (!canRunPublicSearch(input.query)) return { stories: [], hasNext: false };
  const offset = (input.page - 1) * SEARCH_PAGE_SIZE;
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") {
    const term = normalize(input.query);
    const matches = previewStories.filter((story) => normalize(`${story.title} ${story.excerpt ?? ""} ${story.category}`).includes(term));
    const stories = matches.slice(offset, offset + SEARCH_PAGE_SIZE);
    return { stories, hasNext: matches.length > offset + stories.length };
  }

  const [{ createPublicationRepository }, { getCachedPublicSearch }] = await Promise.all([
    import("@/features/publication/repositories"), import("@/features/publication/cached-data"),
  ]);
  const repository = createPublicationRepository();
  const rows = await getCachedPublicSearch({ query: input.query, categorySlug: input.category,
    offset, limit: SEARCH_PAGE_SIZE + 1 });
  const pageRows = rows.slice(0, SEARCH_PAGE_SIZE);
  const mediaIds = [...new Set(pageRows.map((row) => row.featuredMediaId).filter((id): id is string => Boolean(id)))];
  const media = await repository.findPublicMediaByIds(mediaIds);
  const artwork = ["pitch", "strategy", "portrait", "tournament"] as const;
  return {
    hasNext: rows.length > SEARCH_PAGE_SIZE,
    stories: pageRows.map((row, index) => ({
      slug: row.slug,
      category: input.category ? categoryPageBySlug(input.category)?.name ?? "Ακαδημίες" : "Ακαδημίες",
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      author: row.authorName ?? "Ακαδημίες Editorial",
      readingTime: "Άρθρο",
      artwork: artwork[index % artwork.length] ?? "pitch",
      imageAlt: row.title,
      imageUrl: media.find((asset) => asset.id === row.featuredMediaId)?.url,
      href: `/posts/${row.slug}`,
    })),
  };
}
