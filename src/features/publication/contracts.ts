import {
  articleTemplateKeys,
  headerTemplateKeys,
  postStatuses,
} from "@/db/schema";

export type HeaderTemplateKey = (typeof headerTemplateKeys)[number];
export type ArticleTemplateKey = (typeof articleTemplateKeys)[number];
export type PostStatus = (typeof postStatuses)[number];

export const publicationDefaults = {
  headerTemplate: "minimal_editorial",
  articleTemplate: "longform",
} as const satisfies {
  headerTemplate: HeaderTemplateKey;
  articleTemplate: ArticleTemplateKey;
};

export type TemplateSelection = {
  postHeaderTemplate?: HeaderTemplateKey | null;
  postArticleTemplate?: ArticleTemplateKey | null;
  categoryHeaderTemplate?: HeaderTemplateKey | null;
  categoryArticleTemplate?: ArticleTemplateKey | null;
};

export function resolveTemplates(selection: TemplateSelection) {
  return {
    headerTemplate:
      selection.postHeaderTemplate ??
      selection.categoryHeaderTemplate ??
      publicationDefaults.headerTemplate,
    articleTemplate:
      selection.postArticleTemplate ??
      selection.categoryArticleTemplate ??
      publicationDefaults.articleTemplate,
  } satisfies {
    headerTemplate: HeaderTemplateKey;
    articleTemplate: ArticleTemplateKey;
  };
}

export function isPubliclyVisible(input: {
  status: PostStatus;
  publishedAt: Date | null;
  now?: Date;
}): boolean {
  if (input.status !== "published" || !input.publishedAt) return false;
  return input.publishedAt.getTime() <= (input.now ?? new Date()).getTime();
}

export const editorialRoles = [
  "owner",
  "editor",
  "author",
  "migration_reviewer",
] as const;

export type EditorialRole = (typeof editorialRoles)[number];

export function canReadEditorialContent(role: string): role is EditorialRole {
  return editorialRoles.includes(role as EditorialRole);
}
