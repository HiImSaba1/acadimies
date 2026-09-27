import type { InspectedWordPressItem, WordPressInspection } from "./inspect";
import type { importStates } from "@/db/schema";

export type ImportState = (typeof importStates)[number];

export type StagedLegacyRecord = {
  externalId: string;
  sourceType: string;
  checksumSha256: string;
  state: "staged" | "quarantined" | "excluded";
  sourceUrl: string;
  riskFlags: string[];
  payload: Record<string, unknown>;
};

const SUPPORTED_TYPES = new Set(["post", "page", "attachment"]);

export function stageStateFor(item: InspectedWordPressItem): StagedLegacyRecord["state"] {
  if (item.riskFlags.length) return "quarantined";
  return SUPPORTED_TYPES.has(item.postType) ? "staged" : "excluded";
}

export function shouldRefreshStagedRecord(state: ImportState, previousChecksum: string, nextChecksum: string): boolean {
  return (state === "staged" || state === "quarantined" || state === "failed") && previousChecksum !== nextChecksum;
}

export function toStagedLegacyRecord(item: InspectedWordPressItem): StagedLegacyRecord {
  return {
    externalId: item.externalId,
    sourceType: item.postType,
    checksumSha256: item.checksumSha256,
    state: stageStateFor(item),
    sourceUrl: item.sourceUrl,
    riskFlags: item.riskFlags,
    payload: {
      title: item.title,
      slug: item.slug,
      status: item.status,
      publishedAt: item.publishedAt,
      creatorLogin: item.creatorLogin,
      attachmentUrl: item.attachmentUrl,
      parentExternalId: item.parentExternalId,
      featuredMediaExternalId: item.featuredMediaExternalId,
      categories: item.categories,
      sanitizedHtml: item.sanitizedHtml,
      sanitizedExcerpt: item.sanitizedExcerpt,
    },
  };
}

export function createWordPressStagePlan(inspection: WordPressInspection) {
  const records = inspection.items.map(toStagedLegacyRecord);
  const uniqueKeys = new Set<string>();
  for (const record of records) {
    const key = `${record.sourceType}:${record.externalId}`;
    if (uniqueKeys.has(key)) throw new Error(`Duplicate legacy identifier in WXR: ${key}`);
    uniqueKeys.add(key);
  }
  const states = { staged: 0, quarantined: 0, excluded: 0 };
  for (const record of records) states[record.state]++;
  return { records, states, items: records.length };
}
