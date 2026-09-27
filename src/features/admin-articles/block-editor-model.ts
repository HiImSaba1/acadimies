import type { ArticleDocument } from "@/features/articles/document";

export type ArticleBlock = ArticleDocument["blocks"][number];
export type ArticleBlockType = ArticleBlock["type"];

export function newArticleBlock(type: ArticleBlockType): ArticleBlock {
  switch (type) {
    case "paragraph": return { type, text: "" };
    case "heading": return { type, text: "" };
    case "quote": return { type, text: "", attribution: "" };
    case "question": return { type, question: "", answer: "" };
    case "cta": return { type, label: "Επικοινώνησε μαζί μας", href: "/contact" };
    case "score": return { type, home: "", away: "", homeScore: 0, awayScore: 0, minute: "" };
    case "image": return { type, mediaId: "", alt: "", caption: "" };
    case "chapter": return { type, heading: "", text: "", mediaId: "", alt: "", imageSide: "left" };
  }
}

export function insertArticleBlock(blocks: ArticleBlock[], type: ArticleBlockType, afterIndex = blocks.length - 1): ArticleBlock[] {
  const next = [...blocks];
  next.splice(Math.max(0, Math.min(afterIndex + 1, next.length)), 0, newArticleBlock(type));
  return next;
}

export function moveArticleBlock(blocks: ArticleBlock[], index: number, direction: -1 | 1): ArticleBlock[] {
  const target = index + direction;
  if (index < 0 || index >= blocks.length || target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeArticleBlock(blocks: ArticleBlock[], index: number): ArticleBlock[] {
  if (blocks.length <= 1 || index < 0 || index >= blocks.length) return blocks;
  return blocks.filter((_, blockIndex) => blockIndex !== index);
}

export function replaceArticleBlock(blocks: ArticleBlock[], index: number, block: ArticleBlock): ArticleBlock[] {
  if (index < 0 || index >= blocks.length) return blocks;
  return blocks.map((existing, blockIndex) => blockIndex === index ? block : existing);
}
