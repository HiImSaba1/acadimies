import { describe, expect, it } from "vitest";
import { homeSections, tickerItems } from "./demo-home";

describe("homepage editorial fixture", () => {
  it("uses unique stable slugs and meaningful image alternatives", () => {
    const stories = Object.values(homeSections).flat();
    expect(new Set(stories.map((story) => story.slug)).size).toBe(stories.length);
    expect(stories.every((story) => story.imageAlt.trim().length >= 10)).toBe(true);
  });

  it("keeps enough ticker stories for a continuous rail", () => {
    expect(tickerItems.length).toBeGreaterThanOrEqual(3);
  });

  it("labels illustrative card dates separately from persisted publication dates", () => {
    const stories = Object.values(homeSections).flat();
    expect(stories.every((story) => Boolean(story.previewDate) && !story.publishedAt)).toBe(true);
  });
});
