import type { WordPressInspection } from "./inspect";
import { createWordPressMediaPlan } from "./media-plan";
import { createWordPressPostPlan } from "./post-plan";

type AuditPost = { id: string; title: string; year: string; status: string; featuredAttachmentId: string | null; categories: string[] };

function increment(values: Record<string, number>, key: string) {
  values[key] = (values[key] ?? 0) + 1;
}

function yearOf(value: string | null) {
  const year = value?.match(/^(\d{4})/)?.[1];
  return year ?? "unknown";
}

export function createWordPressEditorialAudit(inspection: WordPressInspection, sampleLimit = 12) {
  if (!Number.isSafeInteger(sampleLimit) || sampleLimit < 0 || sampleLimit > 50) {
    throw new Error("Sample limit must be between 0 and 50.");
  }
  const media = createWordPressMediaPlan(inspection);
  const posts = createWordPressPostPlan(inspection);
  const attachmentIds = new Set(inspection.items.filter((item) => item.postType === "attachment").map((item) => item.externalId));
  const years: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  let featuredResolved = 0;
  let featuredMissing = 0;
  const samples: AuditPost[] = [];

  for (const item of inspection.items) {
    if (item.postType !== "post" && item.postType !== "page") continue;
    increment(years, yearOf(item.publishedAt));
    increment(statuses, item.status);
    for (const category of item.categories.filter((category) => category.domain === "category")) {
      increment(categories, category.slug || category.name || "unknown");
    }
    if (item.featuredMediaExternalId) {
      if (attachmentIds.has(item.featuredMediaExternalId)) featuredResolved++;
      else featuredMissing++;
    }
    if (item.status === "publish" && !item.riskFlags.length && samples.length < sampleLimit) {
      samples.push({ id: item.externalId, title: item.title.slice(0, 180), year: yearOf(item.publishedAt),
        status: item.status, featuredAttachmentId: item.featuredMediaExternalId,
        categories: item.categories.filter((category) => category.domain === "category")
          .map((category) => category.slug || category.name).slice(0, 5) });
    }
  }

  const sorted = (values: Record<string, number>) => Object.entries(values)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return {
    source: inspection.source,
    reconciliation: { totalItems: inspection.totals.items, postAndPageItems: posts.counts.articlesAndPages,
      attachmentItems: media.counts.attachments, otherItems: inspection.totals.items - posts.counts.articlesAndPages - media.counts.attachments },
    posts: posts.counts,
    media: media.counts,
    imageReferences: { featuredResolved, featuredMissing, inlineUnmatched: posts.counts.unmatchedInlineImages },
    originalStatuses: sorted(statuses),
    years: sorted(years),
    categories: sorted(categories),
    samples,
    databaseWrites: false,
    mediaDownloads: false,
    publicContentWrites: false,
  };
}
