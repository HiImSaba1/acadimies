import { describe, expect, it } from "vitest";
import { canReviewLegacyRecord, reviewDestination } from "./review-policy";

describe("WordPress review policy", () => {
  it("approves only clean, supported staged records", () => {
    for (const sourceType of ["post", "page", "attachment"]) {
      expect(canReviewLegacyRecord({ state: "staged", sourceType, riskFlags: [] }, "approve")).toBe(true);
    }
    expect(canReviewLegacyRecord({ state: "staged", sourceType: "nav_menu_item", riskFlags: [] }, "approve")).toBe(false);
    expect(canReviewLegacyRecord({ state: "quarantined", sourceType: "post", riskFlags: ["active-content"] }, "approve")).toBe(false);
    expect(canReviewLegacyRecord({ state: "staged", sourceType: "post", riskFlags: ["suspected-spam"] }, "approve")).toBe(false);
  });

  it("can exclude a candidate or withdraw approval, but cannot mutate promoted content", () => {
    for (const state of ["staged", "quarantined", "approved"] as const) {
      expect(canReviewLegacyRecord({ state, sourceType: "post", riskFlags: [] }, "exclude")).toBe(true);
    }
    for (const state of ["excluded", "promoted", "failed"] as const) {
      expect(canReviewLegacyRecord({ state, sourceType: "post", riskFlags: [] }, "exclude")).toBe(false);
    }
    expect(reviewDestination("approve")).toBe("approved");
    expect(reviewDestination("exclude")).toBe("excluded");
  });
});
