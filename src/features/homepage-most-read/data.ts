import "server-only";

import type { DemoStory } from "@/content/demo-home";
import { categoryPages } from "@/features/category-pages/catalog";
import { getCategoryStories } from "@/features/category-pages/data";

export async function getHomepageCategoryVarietyStories(): Promise<DemoStory[]> {
  const categoryStories = await Promise.all(categoryPages.map((category) =>
    getCategoryStories(category.slug, 0, 6, "recent")));
  const unique = new Map<string, DemoStory>();
  for (const stories of categoryStories) {
    const story = stories.find((candidate) => !unique.has(candidate.slug));
    if (story && !unique.has(story.slug)) unique.set(story.slug, story);
  }
  return [...unique.values()];
}
