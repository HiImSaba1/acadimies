import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const wordpressItemSchema = z
  .object({
    title: z.unknown().optional(),
    link: z.unknown().optional(),
    pubDate: z.unknown().optional(),
    "dc:creator": z.unknown().optional(),
    "content:encoded": z.unknown().optional(),
    "excerpt:encoded": z.unknown().optional(),
    "wp:post_id": z.unknown(),
    "wp:post_date_gmt": z.unknown().optional(),
    "wp:post_name": z.unknown().optional(),
    "wp:status": z.unknown(),
    "wp:post_type": z.unknown(),
    "wp:attachment_url": z.unknown().optional(),
    category: z.unknown().optional(),
  })
  .passthrough();

const SPAM_PATTERN =
  /casino|betting|bonus|withdrawal|escort|porn|viagra|onlyfans|crypto\s*casino/i;
const ACTIVE_CONTENT_PATTERN =
  /<script\b|javascript\s*:|<iframe\b|\son(?:error|load|click)\s*=/i;

export type WordPressRiskFlag =
  | "active-content"
  | "foreign-canonical"
  | "missing-title"
  | "suspected-spam";

export type InspectedWordPressItem = {
  externalId: string;
  postType: string;
  status: string;
  title: string;
  slug: string;
  sourceUrl: string;
  publishedAt: string | null;
  creatorLogin: string;
  attachmentUrl: string | null;
  parentExternalId: string | null;
  featuredMediaExternalId: string | null;
  categories: Array<{ domain: string | null; slug: string | null; name: string }>;
  sanitizedHtml: string;
  sanitizedExcerpt: string;
  checksumSha256: string;
  riskFlags: WordPressRiskFlag[];
};

export type WordPressInspection = {
  source: {
    title: string;
    siteUrl: string;
    wxrVersion: string;
    language: string;
  };
  totals: {
    items: number;
    clean: number;
    quarantined: number;
    byPostType: Record<string, number>;
    byStatus: Record<string, number>;
    attachmentsWithRemoteUrl: number;
  };
  items: InspectedWordPressItem[];
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object" && "#text" in value) {
    return textOf((value as { "#text": unknown })["#text"]);
  }

  return "";
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function sanitizeLegacyHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "figure",
      "figcaption",
      "img",
      "picture",
      "source",
    ]),
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
      source: ["src", "srcset", "sizes", "type", "media"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { rel: "noopener noreferrer" },
        true,
      ),
    },
  });
}

function categoriesOf(value: unknown): InspectedWordPressItem["categories"] {
  return asArray(value).map((category) => {
    const record = recordOf(category);
    return {
      domain: record ? textOf(record["@_domain"]) || null : null,
      slug: record ? textOf(record["@_nicename"]) || null : null,
      name: textOf(category),
    };
  });
}

function riskFlagsFor(input: {
  title: string;
  html: string;
  sourceUrl: string;
}): WordPressRiskFlag[] {
  const flags = new Set<WordPressRiskFlag>();
  const combinedText = `${input.title} ${input.html}`;

  if (!input.title.trim()) flags.add("missing-title");
  if (SPAM_PATTERN.test(combinedText)) flags.add("suspected-spam");
  if (ACTIVE_CONTENT_PATTERN.test(input.html)) flags.add("active-content");
  if (
    input.sourceUrl &&
    !/^https?:\/\/(?:www\.)?acadimies\.gr(?:\/|$)/i.test(input.sourceUrl)
  ) {
    flags.add("foreign-canonical");
  }

  return [...flags].sort();
}

function increment(counter: Record<string, number>, key: string): void {
  counter[key || "unknown"] = (counter[key || "unknown"] ?? 0) + 1;
}

export function inspectWordPressExport(xml: string): WordPressInspection {
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
    parseTagValue: false,
    trimValues: false,
  }).parse(xml) as Record<string, unknown>;

  const rss = recordOf(parsed.rss);
  const channel = recordOf(rss?.channel);
  if (!channel) {
    throw new Error("The source is not a readable WordPress WXR export.");
  }

  const items: InspectedWordPressItem[] = [];

  for (const rawItem of asArray(channel.item)) {
    const parsedItem = wordpressItemSchema.safeParse(rawItem);
    if (!parsedItem.success) continue;

    const raw = parsedItem.data;
    const externalId = textOf(raw["wp:post_id"]).trim();
    const postType = textOf(raw["wp:post_type"]).trim();
    const status = textOf(raw["wp:status"]).trim();
    if (!externalId || !postType || !status) continue;

    const title = textOf(raw.title).trim();
    const sourceUrl = textOf(raw.link).trim();
    const originalHtml = textOf(raw["content:encoded"]);
    const originalExcerpt = textOf(raw["excerpt:encoded"]);
    const parentExternalId = textOf(raw["wp:post_parent"]).trim() || null;
    const featuredMediaExternalId = asArray(raw["wp:postmeta"])
      .map(recordOf)
      .find((meta) => textOf(meta?.["wp:meta_key"]) === "_thumbnail_id");
    const featuredMediaId = featuredMediaExternalId
      ? textOf(featuredMediaExternalId["wp:meta_value"]).trim() || null
      : null;
    const itemForChecksum = {
      externalId,
      postType,
      status,
      title,
      sourceUrl,
      html: originalHtml,
      excerpt: originalExcerpt,
      slug: textOf(raw["wp:post_name"]).trim(),
      creatorLogin: textOf(raw["dc:creator"]).trim(),
      attachmentUrl: textOf(raw["wp:attachment_url"]).trim(),
      parentExternalId,
      featuredMediaExternalId: featuredMediaId,
      categories: categoriesOf(raw.category),
    };

    items.push({
      externalId,
      postType,
      status,
      title,
      slug: textOf(raw["wp:post_name"]).trim(),
      sourceUrl,
      publishedAt:
        textOf(raw["wp:post_date_gmt"]).trim() ||
        textOf(raw.pubDate).trim() ||
        null,
      creatorLogin: textOf(raw["dc:creator"]).trim(),
      attachmentUrl: textOf(raw["wp:attachment_url"]).trim() || null,
      parentExternalId,
      featuredMediaExternalId: featuredMediaId,
      categories: categoriesOf(raw.category),
      sanitizedHtml: sanitizeLegacyHtml(originalHtml),
      sanitizedExcerpt: sanitizeLegacyHtml(originalExcerpt),
      checksumSha256: createHash("sha256")
        .update(JSON.stringify(itemForChecksum))
        .digest("hex"),
      riskFlags: riskFlagsFor({ title, html: originalHtml, sourceUrl }),
    });
  }

  const byPostType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const item of items) {
    increment(byPostType, item.postType);
    increment(byStatus, item.status);
  }

  const quarantined = items.filter((item) => item.riskFlags.length > 0).length;

  return {
    source: {
      title: textOf(channel.title).trim(),
      siteUrl: textOf(channel["wp:base_site_url"]).trim(),
      wxrVersion: textOf(channel["wp:wxr_version"]).trim(),
      language: textOf(channel.language).trim(),
    },
    totals: {
      items: items.length,
      clean: items.length - quarantined,
      quarantined,
      byPostType,
      byStatus,
      attachmentsWithRemoteUrl: items.filter(
        (item) => item.postType === "attachment" && item.attachmentUrl,
      ).length,
    },
    items,
  };
}

export function createSafeInspectionReport(inspection: WordPressInspection) {
  return {
    source: inspection.source,
    totals: inspection.totals,
    quarantine: inspection.items
      .filter((item) => item.riskFlags.length > 0)
      .map((item) => ({
        externalId: item.externalId,
        postType: item.postType,
        status: item.status,
        title: item.title,
        sourceUrl: item.sourceUrl,
        riskFlags: item.riskFlags,
      })),
  };
}
