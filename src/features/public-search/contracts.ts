import { categoryPageBySlug } from "@/features/category-pages/catalog";

export const SEARCH_PAGE_SIZE = 18;

export type PublicSearchQuery = {
  query: string;
  category: string | null;
  page: number;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parsePublicSearchParams(params: Record<string, string | string[] | undefined>): PublicSearchQuery {
  const query = first(params.q).trim().replace(/\s+/g, " ").slice(0, 100);
  const requestedCategory = first(params.category).trim();
  const requestedPage = Number.parseInt(first(params.page), 10);
  return {
    query,
    category: categoryPageBySlug(requestedCategory)?.slug ?? null,
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 500) : 1,
  };
}

export function canRunPublicSearch(query: string): boolean {
  return query.length >= 2;
}

export function buildSearchHref(input: PublicSearchQuery, page: number): string {
  const params = new URLSearchParams({ q: input.query });
  if (input.category) params.set("category", input.category);
  if (page > 1) params.set("page", String(page));
  return `/search?${params.toString()}`;
}
