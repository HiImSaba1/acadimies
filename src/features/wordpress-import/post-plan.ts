import sanitizeHtml from "sanitize-html";
import type { ArticleDocument } from "../articles/document";
import { suggestGreeklishSlug } from "../admin-articles/greeklish-slug";
import type { InspectedWordPressItem, WordPressInspection } from "./inspect";
import { stageStateFor } from "./stage";
import { safeWordPressImageUrl } from "./media-plan";

export type WordPressPostCandidate = {
  externalId: string;
  checksumSha256: string;
  originalType: "post" | "page";
  originalStatus: string;
  title: string;
  slug: string;
  sourceUrl: string;
  publishedAt: string | null;
  creatorLogin: string;
  featuredMediaExternalId: string | null;
  inlineMediaExternalIds: string[];
  galleryMediaExternalIds: string[];
  mediaCaptions: Record<string, string>;
  categories: InspectedWordPressItem["categories"];
  sanitizedHtml: string;
  sanitizedExcerpt: string;
};

export function legacyPlainText(html: string): string {
  const withBreaks = html.replace(/<\/(?:p|div|h[1-6]|li|blockquote)>|<br\s*\/?\s*>/gi, "\n");
  return sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function legacyArticleDocument(candidate: WordPressPostCandidate): ArticleDocument {
  const semanticBlocks: ArticleDocument["blocks"] = [];
  for (const match of candidate.sanitizedHtml.matchAll(/<(h[1-6]|p|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = (match[1] ?? "p").toLowerCase();
    const text = legacyPlainText(match[2] ?? "");
    if (!text) continue;
    for (const part of text.match(/[\s\S]{1,2000}/g) ?? []) {
      if (tag.startsWith("h")) semanticBlocks.push({ type: "heading", text: part });
      else if (tag === "blockquote") semanticBlocks.push({ type: "quote", text: part });
      else semanticBlocks.push({ type: "paragraph", text: part });
      if (semanticBlocks.length >= 250) break;
    }
    if (semanticBlocks.length >= 250) break;
  }
  const body = legacyPlainText(candidate.sanitizedHtml);
  const fallbackBlocks = body.split(/\n{1,2}/).map((part) => part.trim()).filter(Boolean)
    .flatMap((segment) => segment.match(/[\s\S]{1,2000}/g) ?? [])
    .slice(0, 250).map((text) => ({ type: "paragraph" as const, text }));
  const blocks = semanticBlocks.length ? semanticBlocks : fallbackBlocks;
  // The entire sanitized WXR body is separately retained in posts.sanitized_legacy_html.
  return { dek: legacyPlainText(candidate.sanitizedExcerpt).slice(0, 600),
    blocks: blocks.length ? blocks : [{ type: "paragraph" as const, text: "Το ιστορικό περιεχόμενο χρειάζεται έλεγχο από τη συντακτική ομάδα." }] };
}

export function createWordPressPostPlan(inspection: WordPressInspection) {
  const counts = { articlesAndPages: 0, eligibleForReview: 0, quarantined: 0, emptyTitle: 0, missingBody: 0,
    publishedOriginally: 0, draftsOriginally: 0, trashedOriginally: 0, withFeaturedReference: 0,
    withInlineImages: 0, withGalleryShortcodes: 0, unmatchedInlineImages: 0 };
  const attachmentIdsByUrl = new Map<string, string>();
  const attachmentIds = new Set<string>();
  for (const item of inspection.items.filter((item) => item.postType === "attachment")) {
    const url = safeWordPressImageUrl(item.attachmentUrl);
    if (url) {
      attachmentIdsByUrl.set(url.replace(/-\d+x\d+(?=\.[^.]+$)/i, ""), item.externalId);
      attachmentIds.add(item.externalId);
    }
  }
  const candidates: WordPressPostCandidate[] = [];
  for (const item of inspection.items) {
    if (item.postType !== "post" && item.postType !== "page") continue;
    counts.articlesAndPages++;
    if (item.status === "publish") counts.publishedOriginally++;
    else if (item.status === "trash") counts.trashedOriginally++;
    else counts.draftsOriginally++;
    if (stageStateFor(item) !== "staged") { counts.quarantined++; continue; }
    if (!item.title) { counts.emptyTitle++; continue; }
    if (!legacyPlainText(item.sanitizedHtml)) counts.missingBody++;
    if (item.featuredMediaExternalId) counts.withFeaturedReference++;
    const inlineMediaExternalIds = new Set<string>();
    for (const match of item.sanitizedHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
      const url = safeWordPressImageUrl(match[1] ?? null);
      const id = url ? attachmentIdsByUrl.get(url.replace(/-\d+x\d+(?=\.[^.]+$)/i, "")) : null;
      if (id) inlineMediaExternalIds.add(id);
      else counts.unmatchedInlineImages++;
    }
    if (inlineMediaExternalIds.size) counts.withInlineImages++;
    const mediaCaptions: Record<string, string> = {};
    for (const figure of item.sanitizedHtml.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)) {
      const content = figure[1] ?? "";
      const source = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
      const caption = legacyPlainText(content.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? "").slice(0, 500);
      const url = safeWordPressImageUrl(source ?? null);
      const id = url ? attachmentIdsByUrl.get(url.replace(/-\d+x\d+(?=\.[^.]+$)/i, "")) : null;
      if (id && caption) mediaCaptions[id] = caption;
    }
    const galleryMediaExternalIds = new Set<string>();
    for (const match of item.sanitizedHtml.matchAll(/\[gallery\s+[^\]]*ids=["']([\d,\s]+)["'][^\]]*\]/gi)) {
      for (const id of (match[1] ?? "").split(",").map((part) => part.trim())) {
        if (attachmentIds.has(id)) galleryMediaExternalIds.add(id);
      }
    }
    if (galleryMediaExternalIds.size) counts.withGalleryShortcodes++;
    const rawSlug = /^[a-z0-9-]{1,191}$/i.test(item.slug) ? item.slug.toLowerCase() : suggestGreeklishSlug(item.title);
    candidates.push({ externalId: item.externalId, checksumSha256: item.checksumSha256,
      originalType: item.postType, originalStatus: item.status, title: item.title,
      slug: rawSlug, sourceUrl: item.sourceUrl, publishedAt: item.publishedAt,
      creatorLogin: item.creatorLogin, featuredMediaExternalId: item.featuredMediaExternalId,
      inlineMediaExternalIds: [...inlineMediaExternalIds], galleryMediaExternalIds: [...galleryMediaExternalIds], mediaCaptions,
      categories: item.categories, sanitizedHtml: item.sanitizedHtml, sanitizedExcerpt: item.sanitizedExcerpt });
  }
  counts.eligibleForReview = candidates.length;
  if (counts.eligibleForReview + counts.quarantined + counts.emptyTitle !== counts.articlesAndPages) {
    throw new Error("WordPress post reconciliation failed.");
  }
  return { counts, candidates };
}
