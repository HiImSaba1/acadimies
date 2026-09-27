import type { ImportState } from "./stage";

export function canPromoteLegacyDraft(input: {
  state: ImportState;
  sourceType: string;
  riskFlags: readonly string[];
  sourceChecksum: string;
  stagedChecksum: string;
  existingPostId: string | null;
}): boolean {
  return input.state === "approved" && ["post", "page"].includes(input.sourceType) &&
    input.riskFlags.length === 0 && input.sourceChecksum === input.stagedChecksum &&
    input.existingPostId === null;
}

export function legacyPromotionStatus(originalStatus: string, publishedAt: Date | null): "published" | "draft" {
  return originalStatus === "publish" && publishedAt ? "published" : "draft";
}
