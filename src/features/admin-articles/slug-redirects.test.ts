import { describe, expect, it } from "vitest";
import { assertRedirectOwnership, needsPublishedSlugRedirect } from "./slug-redirects";

describe("article slug redirects", () => {
  it("creates redirects only when the live slug changes", () => {
    expect(needsPublishedSlugRedirect("published", "old-story", "new-story")).toBe(true);
    expect(needsPublishedSlugRedirect("draft", "old-story", "new-story")).toBe(false);
    expect(needsPublishedSlugRedirect("published", "same-story", "same-story")).toBe(false);
  });

  it("allows reclaiming the same article's historical slug and rejects cross-article collisions", () => {
    expect(assertRedirectOwnership("article-1", "article-1")).toBe(true);
    expect(assertRedirectOwnership(null, "article-1")).toBe(false);
    expect(() => assertRedirectOwnership("article-2", "article-1")).toThrow("ARTICLE_REDIRECT_COLLISION");
  });
});
