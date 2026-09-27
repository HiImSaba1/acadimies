import { describe, expect, it } from "vitest";
import { defaultArticleDocument } from "./contracts";
import { parseRecoverableDraft } from "./draft-recovery";

describe("browser draft recovery boundary", () => {
  it("offers recovery only for a valid document different from the persisted revision", () => {
    const persisted = defaultArticleDocument();
    expect(parseRecoverableDraft(JSON.stringify({ savedAt: "now", document: persisted }), persisted)).toBeNull();
    const changed = { ...persisted, blocks: [{ type: "paragraph" as const, text: "Μη αποθηκευμένη αλλαγή" }] };
    expect(parseRecoverableDraft(JSON.stringify({ savedAt: "now", document: changed }), persisted))
      .toEqual({ savedAt: "now", document: changed });
  });

  it("never applies malformed local data over the database value", () => {
    const persisted = defaultArticleDocument();
    expect(parseRecoverableDraft("not-json", persisted)).toBeNull();
    expect(parseRecoverableDraft(JSON.stringify({ document: { dek: "", blocks: [] } }), persisted)).toBeNull();
  });
});
