import { describe, expect, it } from "vitest";
import { proofreadGreekText } from "./greek-proofreading";

describe("offline Greek editorial hints", () => {
  it("suggests punctuation, repetition and selected missing accents without rewriting copy", () => {
    const input = "Τα παιδια παιδια  παίζουν ,χωρίς παύση.";
    const codes = proofreadGreekText(input).map((hint) => hint.code);
    expect(codes).toContain("spaces");
    expect(codes).toContain("punctuation-before");
    expect(codes).toContain("punctuation-after");
    expect(codes).toContain("repeated-word");
    expect(codes).toContain("accent-παιδια");
    expect(input).toBe("Τα παιδια παιδια  παίζουν ,χωρίς παύση.");
  });

  it("does not claim an error for clean editorial copy", () => {
    expect(proofreadGreekText("Οι ακαδημίες βοηθούν τα παιδιά.")).toEqual([]);
  });
});
