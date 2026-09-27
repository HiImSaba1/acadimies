import { describe, expect, it } from "vitest";
import { buildArticleBreadcrumbData, buildArticleStructuredData, safeJsonLd } from "./structured-data";

describe("article structured data", () => {
  it("uses stable absolute canonical and image URLs", () => {
    const result = buildArticleStructuredData({ title: "Νέα ακαδημιών", description: "Ενημέρωση", slug: "nea",
      publishedAt: new Date("2026-09-15T10:00:00Z"), updatedAt: new Date("2026-09-15T11:00:00Z"),
      authorName: "Συντάκτης", authorUrl: "/dora-ioakeimidou", imageUrl: "/wordpress-media/2.webp",
      categoryName: "Νέα Ακαδημιών", keywords: ["Golden Cup", "Ακαδημίες"] });
    expect(result.url).toBe("https://acadimies.gr/posts/nea");
    expect(result.image).toEqual(["https://acadimies.gr/wordpress-media/2.webp"]);
    expect(result.datePublished).toBe("2026-09-15T10:00:00.000Z");
    expect(result.dateModified).toBe("2026-09-15T11:00:00.000Z");
    expect(result.articleSection).toBe("Νέα Ακαδημιών");
    expect(result.author.url).toBe("https://acadimies.gr/dora-ioakeimidou");
    expect(result.keywords).toEqual(["Golden Cup", "Ακαδημίες"]);
  });
  it("escapes markup before embedding JSON-LD into HTML", () => {
    expect(safeJsonLd({ title: "</script><script>bad</script>" })).not.toContain("<");
    expect(buildArticleBreadcrumbData("Άρθρο", "arthro").itemListElement).toHaveLength(2);
  });
});
