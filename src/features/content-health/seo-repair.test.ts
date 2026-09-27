import { describe, expect, it } from "vitest";
import { assessYoastStyleMetadata, boundedEditorialText, buildMissingEditorialMetadata,
  inferFocusKeyphrase, plainEditorialText } from "./seo-repair";

describe("editorial metadata repair", () => {
  it("removes markup, shortcodes, URLs and decodes entities", () => {
    expect(plainEditorialText("<p>Παιδί &amp; μπάλα</p> [gallery] https://example.com"))
      .toBe("Παιδί & μπάλα");
  });

  it("prefers a complete sentence inside the requested limit", () => {
    const text = "Η σωστή προπόνηση βοηθά τα παιδιά να εξελιχθούν με ασφάλεια. Η δεύτερη πρόταση είναι μεγαλύτερη.";
    expect(boundedEditorialText(text, 75)).toBe("Η σωστή προπόνηση βοηθά τα παιδιά να εξελιχθούν με ασφάλεια.");
  });

  it("fills only missing fields and respects SEO limits", () => {
    const result = buildMissingEditorialMetadata({ title: "Ένας πολύ μεγάλος τίτλος για τις ακαδημίες ποδοσφαίρου και την εξέλιξη των παιδιών",
      excerpt: null, seoTitle: null, seoDescription: null,
      contentDocument: { dek: "", blocks: [{ type: "paragraph", text: "Η εξέλιξη των παιδιών χρειάζεται υπομονή, γνώση και ασφαλές περιβάλλον. ".repeat(6) }] },
      sanitizedLegacyHtml: null });
    expect(result.excerpt?.length).toBeLessThanOrEqual(240);
    expect(result.seoTitle?.length).toBeLessThanOrEqual(60);
    expect(result.seoDescription?.length).toBeLessThanOrEqual(155);
    expect(assessYoastStyleMetadata("Ένας πολύ μεγάλος τίτλος για τις ακαδημίες", result.seoTitle,
      result.seoDescription).passesDeterministicChecks).toBe(true);
  });

  it("preserves existing editorial metadata", () => {
    expect(buildMissingEditorialMetadata({ title: "Τίτλος", excerpt: "Υπάρχον απόσπασμα",
      seoTitle: "Υπάρχων SEO τίτλος", seoDescription: "Υπάρχουσα SEO περιγραφή",
      contentDocument: {}, sanitizedLegacyHtml: null })).toEqual({ excerpt: "Υπάρχον απόσπασμα",
      seoTitle: "Υπάρχων SEO τίτλος", seoDescription: "Υπάρχουσα SEO περιγραφή" });
  });

  it("infers a bounded focus phrase without leading Greek stop words", () => {
    expect(inferFocusKeyphrase("Η εξέλιξη των παιδιών στις ακαδημίες ποδοσφαίρου"))
      .toBe("εξέλιξη παιδιών στις ακαδημίες");
  });
});
