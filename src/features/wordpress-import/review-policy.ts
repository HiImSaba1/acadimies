import type { ImportState } from "./stage";

export type ReviewDecision = "approve" | "exclude";

export function canReviewLegacyRecord(input: {
  state: ImportState;
  sourceType: string;
  riskFlags: readonly string[];
}, decision: ReviewDecision): boolean {
  if (decision === "approve") {
    return input.state === "staged"
      && input.riskFlags.length === 0
      && ["post", "page", "attachment"].includes(input.sourceType);
  }
  return ["staged", "quarantined", "approved"].includes(input.state);
}

export function reviewDestination(decision: ReviewDecision): "approved" | "excluded" {
  return decision === "approve" ? "approved" : "excluded";
}
