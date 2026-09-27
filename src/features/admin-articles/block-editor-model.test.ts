import { describe, expect, it } from "vitest";
import { articleDocumentSchema } from "@/features/articles/document";
import { insertArticleBlock, moveArticleBlock, newArticleBlock, removeArticleBlock, replaceArticleBlock } from "./block-editor-model";

describe("visual article block editor", () => {
  it("keeps a valid typed document through insertion, editing, and reordering", () => {
    const original = [newArticleBlock("paragraph")];
    const inserted = insertArticleBlock(original, "question");
    const edited = replaceArticleBlock(inserted, 1, { type: "question", question: "Τι αλλάζει;", answer: "Η προσέγγιση." });
    const moved = moveArticleBlock(edited, 1, -1);
    expect(moved[0]).toEqual({ type: "question", question: "Τι αλλάζει;", answer: "Η προσέγγιση." });
    expect(articleDocumentSchema.safeParse({ dek: "", blocks: moved }).success).toBe(true);
    expect(original).toEqual([{ type: "paragraph", text: "" }]);
  });

  it("never removes the final block or moves outside bounds", () => {
    const blocks = [newArticleBlock("paragraph")];
    expect(removeArticleBlock(blocks, 0)).toBe(blocks);
    expect(moveArticleBlock(blocks, 0, -1)).toBe(blocks);
    expect(moveArticleBlock(blocks, 0, 1)).toBe(blocks);
  });

  it("creates an alternating media chapter without changing old document blocks", () => {
    const chapter = newArticleBlock("chapter");
    expect(chapter).toEqual({ type: "chapter", heading: "", text: "", mediaId: "", alt: "", imageSide: "left" });
    expect(articleDocumentSchema.safeParse({ dek: "", blocks: [{ ...chapter, mediaId: "media-1", alt: "Προπόνηση" }] }).success).toBe(true);
  });

  it("creates an editable schema-compatible CTA", () => {
    const cta = newArticleBlock("cta");
    expect(cta).toEqual({ type: "cta", label: "Επικοινώνησε μαζί μας", href: "/contact" });
    expect(articleDocumentSchema.safeParse({ dek: "", blocks: [cta] }).success).toBe(true);
  });
});
