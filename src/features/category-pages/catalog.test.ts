import { describe, expect, it } from "vitest";
import { categoryPageBySlug, categoryPages } from "./catalog";

describe("category page catalog", () => {
  it("defines unique, indexable main category routes", () => {
    expect(categoryPages).toHaveLength(6);
    expect(new Set(categoryPages.map(({ slug }) => slug)).size).toBe(categoryPages.length);
    for (const category of categoryPages) {
      expect(categoryPageBySlug(category.slug)).toEqual(category);
      expect(category.name.length).toBeGreaterThan(2);
      expect(category.description.length).toBeGreaterThan(60);
    }
  });
});
