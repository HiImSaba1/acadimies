import type { WordPressInspection } from "./inspect";
import { stageStateFor } from "./stage";

export type WordPressMediaCandidate = {
  externalId: string;
  checksumSha256: string;
  title: string;
  url: string;
  publishedAt: string | null;
};

export function safeWordPressImageUrl(value: string | null): string | null {
  if (!value || value.length > 1024) return null;
  try {
    // Validate the raw path before URL parsing, because URL normalizes dot
    // segments and would otherwise hide traversal attempts such as `/../`.
    const rawPath = value.match(/^https?:\/\/[^/?#]+([^?#]*)/i)?.[1] ?? "";
    const decodedRawPath = decodeURIComponent(rawPath);
    if (decodedRawPath.split("/").some((part) => part === ".." || part === ".")) return null;
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !["acadimies.gr", "www.acadimies.gr"].includes(url.hostname.toLowerCase()) ||
        url.port || url.username || url.password || url.search || url.hash) return null;
    const decodedPath = decodeURIComponent(url.pathname);
    if (!decodedPath.startsWith("/wp-content/uploads/") || /[\\\0-\x1f]/.test(decodedPath)) return null;
    const segments = decodedPath.split("/");
    if (segments.some((part) => part === ".." || part === ".") ||
        !/\.(?:jpe?g|png|gif|webp|avif)$/i.test(segments.at(-1) ?? "")) return null;
    url.protocol = "https:";
    url.hostname = "acadimies.gr";
    return url.href;
  } catch {
    return null;
  }
}

export function createWordPressMediaPlan(inspection: WordPressInspection) {
  const counts = { attachments: 0, eligible: 0, quarantined: 0, excluded: 0, missingUrl: 0, unsafeUrl: 0 };
  const candidates: WordPressMediaCandidate[] = [];
  for (const item of inspection.items) {
    if (item.postType !== "attachment") continue;
    counts.attachments++;
    const state = stageStateFor(item);
    if (state === "quarantined") { counts.quarantined++; continue; }
    if (state === "excluded") { counts.excluded++; continue; }
    if (!item.attachmentUrl) { counts.missingUrl++; continue; }
    const url = safeWordPressImageUrl(item.attachmentUrl);
    if (!url || !/^[1-9]\d*$/.test(item.externalId) || !Number.isSafeInteger(Number(item.externalId))) {
      counts.unsafeUrl++;
      continue;
    }
    counts.eligible++;
    candidates.push({ externalId: item.externalId, checksumSha256: item.checksumSha256, title: item.title, url,
      publishedAt: item.publishedAt });
  }
  if (Object.values(counts).slice(1).reduce((a, b) => a + b, 0) !== counts.attachments) {
    throw new Error("WordPress attachment reconciliation failed.");
  }
  return { counts, candidates };
}
