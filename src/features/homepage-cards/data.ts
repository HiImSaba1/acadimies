import "server-only";

import { categoryPages } from "@/features/category-pages/catalog";
import { getCategoryStories } from "@/features/category-pages/data";
import { buildCategoryMosaic } from "./category-mosaic";

export async function getHomepageCategoryMosaic(heroSlugs: string[]) {
  const groups = await Promise.all(categoryPages.map(async (category) => ({
    slug: category.slug,
    stories: await getCategoryStories(category.slug, 0, 6),
  })));
  return buildCategoryMosaic(Object.fromEntries(groups.map((group) => [group.slug, group.stories])), heroSlugs);
}
