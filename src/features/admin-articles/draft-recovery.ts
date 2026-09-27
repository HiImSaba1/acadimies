import { articleDocumentSchema, type ArticleDocument } from "@/features/articles/document";

export type DraftSnapshot = { savedAt: string; document: ArticleDocument };

export function parseRecoverableDraft(raw: string | null, persisted: ArticleDocument): DraftSnapshot | null {
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as { savedAt?: unknown; document?: unknown };
    const parsed = articleDocumentSchema.safeParse(candidate.document);
    if (!parsed.success || JSON.stringify(parsed.data) === JSON.stringify(persisted)) return null;
    return { savedAt: typeof candidate.savedAt === "string" ? candidate.savedAt : "", document: parsed.data };
  } catch {
    return null;
  }
}
