"use server";

import { categoryPageBySlug } from "./catalog";
import { CATEGORY_PAGE_SIZE, getCategoryStories, getCategoryStoryCount } from "./data";
import { parseCategoryPage, parseCategorySort } from "./sorting";

export async function loadCategoryStoriesPage(slug: string, requestedPage: number, sort?: string) {
  if (!categoryPageBySlug(slug)) return { stories: [], page: 1, totalPages: 1, hasPrevious: false, hasNext: false };
  const page = parseCategoryPage(String(requestedPage));
  const offset = (page - 1) * CATEGORY_PAGE_SIZE;
  const [stories, total] = await Promise.all([
    getCategoryStories(slug, offset, CATEGORY_PAGE_SIZE, parseCategorySort(sort)),
    getCategoryStoryCount(slug),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  return {
    stories,
    page,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}
