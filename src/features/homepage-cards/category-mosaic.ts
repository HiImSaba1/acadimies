import type { DemoStory } from "@/content/demo-home";
import { categoryPages } from "@/features/category-pages/catalog";

export type MosaicCategory = { slug: string; name: string; description: string; stories: DemoStory[] };

export function buildCategoryMosaic(storiesBySlug: Record<string, DemoStory[]>, heroSlugs: string[]): MosaicCategory[] {
  const hero = new Set(heroSlugs);
  const assigned = new Set<string>();
  return categoryPages.flatMap((category, index) => {
    const candidates = storiesBySlug[category.slug] ?? [];
    const storyLimit = index % 3 === 2 ? 2 : 4;
    const selected = candidates.filter((story) => !hero.has(story.slug) && !assigned.has(story.slug)).slice(0, storyLimit);
    selected.forEach((story) => assigned.add(story.slug));
    return selected.length ? [{ slug: category.slug, name: category.name,
      description: category.description, stories: selected }] : [];
  });
}
