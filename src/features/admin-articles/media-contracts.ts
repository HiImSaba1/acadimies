import type { ArticleDocument } from "@/features/articles/document";

export type MediaAssetOption = {
  id: string;
  url: string;
  alt: string;
  label: string;
  width: number | null;
  height: number | null;
};

export const mediaIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function safePublicMediaUrl(input: string | null): string | null {
  if (!input || /[\\\u0000-\u001f\s]/.test(input)) return null;
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function collectArticleMediaReferences(input: {
  featuredMediaId: string | null;
  secondaryMediaId: string | null;
  blocks: ArticleDocument["blocks"];
}): { ids: string[]; valid: boolean } {
  const references = [input.featuredMediaId, input.secondaryMediaId,
    ...input.blocks.flatMap((block) => block.type === "image" || block.type === "chapter" ? [block.mediaId] : [])];
  const valid = references.every((id) => !id || mediaIdPattern.test(id))
    && input.blocks.every((block) => (block.type !== "image" && block.type !== "chapter") || Boolean(block.mediaId));
  return { ids: [...new Set(references.filter((id): id is string => Boolean(id)))], valid };
}
