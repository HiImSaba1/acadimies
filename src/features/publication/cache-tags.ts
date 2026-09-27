const normalizeTagPart = (value: string) =>
  value.trim().toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, "-");

export const publicationCacheTags = {
  all: "publication",
  latest: "publication:latest",
  feed: "publication:feed",
  news: "publication:news",
  post: (slug: string) => `publication:post:${normalizeTagPart(slug)}`,
  category: (slug: string) =>
    `publication:category:${normalizeTagPart(slug)}`,
} as const;

export function affectedPublicationTags(input: {
  postSlug: string;
  categorySlugs?: string[];
}): string[] {
  return [
    publicationCacheTags.all,
    publicationCacheTags.latest,
    publicationCacheTags.feed,
    publicationCacheTags.news,
    publicationCacheTags.post(input.postSlug),
    ...(input.categorySlugs ?? []).map(publicationCacheTags.category),
  ];
}
