import { describe, expect, it } from "vitest";
import { canPromoteLegacyDraft, legacyPromotionStatus } from "./draft-policy";

describe("draft promotion gate", () => {
  const approved = { state: "approved" as const, sourceType: "post", riskFlags: [],
    sourceChecksum: "a", stagedChecksum: "a", existingPostId: null };
  it("allows only a reviewed, unchanged source without an existing target", () => {
    expect(canPromoteLegacyDraft(approved)).toBe(true);
    expect(canPromoteLegacyDraft({ ...approved, state: "staged" })).toBe(false);
    expect(canPromoteLegacyDraft({ ...approved, state: "quarantined" })).toBe(false);
    expect(canPromoteLegacyDraft({ ...approved, sourceType: "attachment" })).toBe(false);
    expect(canPromoteLegacyDraft({ ...approved, riskFlags: ["suspected-spam"] })).toBe(false);
    expect(canPromoteLegacyDraft({ ...approved, stagedChecksum: "b" })).toBe(false);
    expect(canPromoteLegacyDraft({ ...approved, existingPostId: "post-id" })).toBe(false);
  });

  it("publishes approved WordPress publications with their historical date", () => {
    expect(legacyPromotionStatus("publish", new Date("2019-06-12T10:00:00Z"))).toBe("published");
    expect(legacyPromotionStatus("draft", new Date("2019-06-12T10:00:00Z"))).toBe("draft");
    expect(legacyPromotionStatus("publish", null)).toBe("draft");
  });
});
