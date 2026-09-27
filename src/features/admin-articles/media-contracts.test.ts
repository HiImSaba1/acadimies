import { describe, expect, it } from "vitest";
import { safePublicMediaUrl, mediaIdPattern, collectArticleMediaReferences } from "./media-contracts";

describe("editorial media boundaries", () => {
  it("accepts only usable public image URLs", () => {
    expect(safePublicMediaUrl("/webp/story.webp")).toBe("/webp/story.webp");
    expect(safePublicMediaUrl("https://acadimies.gr/image.webp")).toBe("https://acadimies.gr/image.webp");
    expect(safePublicMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safePublicMediaUrl("//unknown.example/image.webp")).toBeNull();
    expect(safePublicMediaUrl("/\\unknown.example/image.webp")).toBeNull();
  });

  it("requires a UUID for persisted media references", () => {
    expect(mediaIdPattern.test("d9595a13-2205-4c17-90f6-0e7754b568de")).toBe(true);
    expect(mediaIdPattern.test("MEDIA PREVIEW 01")).toBe(false);
  });

  it("deduplicates valid article references and rejects unresolved image blocks", () => {
    const id = "d9595a13-2205-4c17-90f6-0e7754b568de";
    expect(collectArticleMediaReferences({ featuredMediaId: id, secondaryMediaId: id,
      blocks: [{ type: "image", mediaId: id, alt: "Παιδιά στο γήπεδο" }] }))
      .toEqual({ ids: [id], valid: true });
    expect(collectArticleMediaReferences({ featuredMediaId: null, secondaryMediaId: null,
      blocks: [{ type: "image", mediaId: "", alt: "Παιδιά στο γήπεδο" }] }).valid).toBe(false);
    expect(collectArticleMediaReferences({ featuredMediaId: null, secondaryMediaId: null,
      blocks: [{ type: "chapter", heading: "Νέο κεφάλαιο", text: "Κείμενο", mediaId: id, alt: "Προπόνηση", imageSide: "right" }] }))
      .toEqual({ ids: [id], valid: true });
  });
});
