import { z } from "zod";
import {
  articleTemplateKeys,
  headerTemplateKeys,
  postStatuses,
  type StaffRole,
} from "@/db/schema";
import { articleDocumentSchema, type ArticleDocument } from "@/features/articles/document";
import { can } from "@/lib/auth/permissions";
import { suggestGreeklishSlug } from "./greeklish-slug";
import { parseAthensDateTimeLocal } from "./schedule";

export const editablePostStatuses = ["draft", "review", "scheduled", "published", "archived"] as const;

export const articleMutationSchema = z.object({
  title: z.string().trim().min(5, "Ο τίτλος χρειάζεται τουλάχιστον 5 χαρακτήρες.").max(512),
  slug: z.string().trim().min(2).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Χρησιμοποιήστε λατινικά πεζά και παύλες."),
  excerpt: z.string().trim().max(1000),
  status: z.enum(editablePostStatuses),
  scheduledFor: z.string().datetime().nullable().default(null),
  headerTemplate: z.enum(headerTemplateKeys).nullable(),
  articleTemplate: z.enum(articleTemplateKeys),
  categoryId: z.string().uuid().nullable(),
  featuredMediaId: z.string().uuid().nullable(),
  secondaryMediaId: z.string().uuid().nullable(),
  seoTitle: z.string().trim().max(255),
  seoDescription: z.string().trim().max(320),
  tagIds: z.array(z.string().uuid()).max(20),
  newTagNames: z.array(z.string().trim().min(2).max(80)).max(10),
  contentDocument: articleDocumentSchema,
});

export type ArticleMutation = z.infer<typeof articleMutationSchema>;

export function parseArticleRevisionSnapshot(value: unknown) {
  return articleMutationSchema.safeParse(value);
}

export function parseNewTagNames(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(/[,;\n]/u).map((name) => name.trim().replace(/\s+/g, " ")).filter(Boolean))].slice(0, 10);
}

export function parseArticleFormData(formData: FormData, fallbackSlug?: string) {
  let contentDocument: ArticleDocument | unknown;
  try {
    contentDocument = JSON.parse(String(formData.get("contentDocument") ?? ""));
  } catch {
    contentDocument = undefined;
  }

  return articleMutationSchema.safeParse({
    title: formData.get("title"),
    slug: String(formData.get("slug") ?? "").trim() || fallbackSlug || suggestGreeklishSlug(String(formData.get("title") ?? "")),
    excerpt: formData.get("excerpt") ?? "",
    status: formData.get("status"),
    scheduledFor: parseAthensDateTimeLocal(formData.get("scheduledFor")),
    headerTemplate: formData.get("headerTemplate") || null,
    articleTemplate: formData.get("articleTemplate"),
    categoryId: formData.get("categoryId") || null,
    featuredMediaId: formData.get("featuredMediaId") || null,
    secondaryMediaId: formData.get("secondaryMediaId") || null,
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
    tagIds: formData.getAll("tagIds"),
    newTagNames: parseNewTagNames(formData.get("newTags")),
    contentDocument,
  });
}

export function mayEditArticle(role: StaffRole, actorId: string, authorId: string | null) {
  return can(role, "article:edit-any") || (can(role, "article:edit-own") && actorId === authorId);
}

export function mayUseStatus(role: StaffRole, status: ArticleMutation["status"]) {
  if (status === "published" || status === "scheduled" || status === "archived") return can(role, "article:publish");
  return can(role, "article:create");
}

export function defaultArticleDocument(): ArticleDocument {
  return { dek: "", blocks: [{ type: "paragraph", text: "" }] };
}

export { postStatuses };
