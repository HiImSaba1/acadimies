import { describe, expect, it } from "vitest";
import { articleDocumentSchema } from "@/features/articles/document";
import { goldenCupDemoPosts, retainedGoldenCupLegacySlug, retainedGoldenCupSlug, retiredGoldenCupDemoSlugs } from "./golden-cup-demo";

describe("27th Golden Cup demo fixtures", () => {
  const posts = goldenCupDemoPosts([{ id: "media-1", alt: "Αθλητές στο γήπεδο" }]);
  it("keeps only the longform article under its production slug", () => {
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ template: "longform", slug: "new-xmas-27o-golden-cup-2027" });
    expect(retainedGoldenCupLegacySlug).toBe("demo-27o-golden-cup-2027-longform");
    expect(retainedGoldenCupSlug).not.toMatch(/demo|longform/);
  });
  it("provides valid Greek documents and bounded SEO metadata", () => {
    for (const post of posts) {
      expect(articleDocumentSchema.safeParse(post.document).success).toBe(true);
      expect(post.title).not.toMatch(/template|longform|matchday|gallery|interview|cinematic|chess|sidebar/i);
      expect(post.excerpt).toContain("3–5 Ιανουαρίου 2027");
      expect(post.excerpt).toContain("32 νέες ακαδημίες");
      expect(post.seoTitle.length).toBeLessThanOrEqual(60);
      expect(post.seoDescription.length).toBeLessThanOrEqual(155);
      expect(post.document.blocks[post.document.blocks.length - 1]).toMatchObject({ type: "cta", href: "/contact" });
    }
  });
  it("identifies only the generated legacy demos approved for cleanup", () => {
    expect(retiredGoldenCupDemoSlugs).toEqual([
      "demo-27o-golden-cup-2027-matchday",
      "demo-27o-golden-cup-2027-gallery",
      "demo-27o-golden-cup-2027-interview",
      "demo-27o-golden-cup-2027-cinematic",
      "demo-27o-golden-cup-2027-chess",
      "demo-27o-golden-cup-2027-sidebar",
    ]);
  });
});
