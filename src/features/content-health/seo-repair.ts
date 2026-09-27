type RepairSource = {
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentDocument: unknown;
  sanitizedLegacyHtml: string | null;
};

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const hex = code[1]?.toLowerCase() === "x";
      const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isSafeInteger(point) ? String.fromCodePoint(point) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

export function plainEditorialText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/\[[^\]]+]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function boundedEditorialText(value: string, maximum: number) {
  const clean = plainEditorialText(value);
  if (clean.length <= maximum) return clean;
  const sentence = clean.slice(0, maximum + 1).match(/^(.{40,}?[.!;·;?])(?:\s|$)/u)?.[1];
  if (sentence && sentence.length <= maximum) return sentence.trim();
  const clipped = clean.slice(0, maximum);
  const wordBoundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, wordBoundary > maximum * 0.6 ? wordBoundary : maximum - 1).trim().replace(/[,:;·;-]+$/u, "")}…`;
}

const focusStopWords = new Set(["και", "για", "στη", "στο", "στην", "στον", "της", "του", "των", "με", "από", "ένα", "μια", "οι", "τα", "το", "η", "ο"]);

export function inferFocusKeyphrase(title: string) {
  const words = plainEditorialText(title).replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/)
    .filter((word) => word.length > 1 && !focusStopWords.has(word.toLocaleLowerCase("el-GR")));
  return words.slice(0, 4).join(" ");
}

function normalizedForMatch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("el-GR");
}

export function yoastStyleDescription(title: string, source: string) {
  const keyphrase = inferFocusKeyphrase(title);
  const cleanSource = plainEditorialText(source);
  if (!keyphrase || normalizedForMatch(cleanSource).includes(normalizedForMatch(keyphrase))) {
    return boundedEditorialText(cleanSource, 155);
  }
  return boundedEditorialText(`${keyphrase}: ${cleanSource}`, 155);
}

export function assessYoastStyleMetadata(title: string, seoTitle: string | null, description: string | null) {
  const keyphrase = inferFocusKeyphrase(title);
  const normalizedKeyphrase = normalizedForMatch(keyphrase);
  const inTitle = Boolean(keyphrase && normalizedForMatch(seoTitle ?? "").includes(normalizedKeyphrase));
  const inDescription = Boolean(keyphrase && normalizedForMatch(description ?? "").includes(normalizedKeyphrase));
  return { keyphrase, titleWithinLimit: Boolean(seoTitle && seoTitle.length <= 60),
    descriptionWithinLimit: Boolean(description && description.length <= 155), inTitle, inDescription,
    passesDeterministicChecks: Boolean(keyphrase && inTitle && inDescription && seoTitle && seoTitle.length <= 60
      && description && description.length <= 155) };
}

function collectDocumentText(value: unknown, texts: string[] = []): string[] {
  if (!value) return texts;
  if (typeof value === "string") {
    if (value.trim()) texts.push(value);
    return texts;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectDocumentText(item, texts);
    return texts;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (["alt", "caption", "mediaId", "imageSide", "type"].includes(key)) continue;
      collectDocumentText(child, texts);
    }
  }
  return texts;
}

export function buildMissingEditorialMetadata(source: RepairSource) {
  const documentText = collectDocumentText(source.contentDocument).join(" ");
  const body = plainEditorialText(documentText) || plainEditorialText(source.sanitizedLegacyHtml ?? "");
  const existingExcerpt = source.excerpt?.trim() || null;
  const excerpt = existingExcerpt ?? (body ? boundedEditorialText(body, 240) : null);
  const seoTitle = source.seoTitle?.trim() || boundedEditorialText(source.title, 60) || null;
  const descriptionSource = existingExcerpt ?? excerpt ?? body;
  const seoDescription = source.seoDescription?.trim()
    || (descriptionSource ? yoastStyleDescription(source.title, descriptionSource) : null);
  return { excerpt, seoTitle, seoDescription };
}
