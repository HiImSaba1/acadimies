export const TOPIC_PAGE_SIZE = 12;

export function parseTopicPage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function topicCanonical(slug: string, page: number): string {
  return page > 1 ? `/topic/${slug}?page=${page}` : `/topic/${slug}`;
}
