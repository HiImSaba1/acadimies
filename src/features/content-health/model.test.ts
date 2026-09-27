import { describe, expect, it } from "vitest";
import { articleHealthIssues } from "./model";

describe("editorial content health", () => {
  it("returns every actionable publication gap", () => {
    expect(articleHealthIssues({ authorId: null, featuredMediaId: null, categoryCount: 0, excerpt: " ",
      seoTitle: null, seoDescription: "" })).toEqual([
      "missing-author", "missing-featured-media", "missing-category", "missing-excerpt",
      "missing-seo-title", "missing-seo-description",
    ]);
  });

  it("treats complete published metadata as healthy", () => {
    expect(articleHealthIssues({ authorId: "author-id", featuredMediaId: "media-id", categoryCount: 1,
      excerpt: "Σύντομη περίληψη", seoTitle: "SEO τίτλος", seoDescription: "SEO περιγραφή" })).toEqual([]);
  });
});
