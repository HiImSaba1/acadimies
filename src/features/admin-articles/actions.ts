"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability, requireStaffSession } from "@/lib/auth/session";
import { revalidatePublication } from "@/features/publication/revalidation";
import { mayEditArticle, mayUseStatus, parseArticleFormData } from "./contracts";
import { suggestGreeklishSlug } from "./greeklish-slug";
import { isArticleTemplateKey } from "./template-catalog";
import { isFutureSchedule } from "./schedule";

export type ArticleActionState = { error?: string };

export async function deleteArticleAction(formData: FormData) {
  const session = await requireCapability("article:delete");
  const articleId = String(formData.get("articleId") ?? "");
  const returnYear = String(formData.get("returnYear") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(articleId) || !/^\d{4}$/.test(returnYear)) redirect("/admin/articles");
  const { deleteAdminArticle } = await import("./repository");
  const deleted = await deleteAdminArticle(articleId, session.user.id);
  if (deleted) revalidatePublication({ postSlug: deleted.slug, categorySlugs: deleted.categorySlugs });
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${returnYear}`);
  redirect(`/admin/articles/${returnYear}?deleted=1`);
}

function validationMessage() {
  return "Ελέγξτε τον τίτλο, το slug και τα υποχρεωτικά πεδία του άρθρου.";
}

export async function createArticleAction(
  _state: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const session = await requireCapability("article:create");
  const parsed = parseArticleFormData(formData);
  if (!parsed.success) return { error: validationMessage() };
  if (!mayUseStatus(session.user.role, parsed.data.status)) {
    return { error: "Δεν έχετε δικαίωμα δημοσίευσης ή αρχειοθέτησης." };
  }
  if (parsed.data.status === "scheduled" && !isFutureSchedule(parsed.data.scheduledFor)) {
    return { error: "Επιλέξτε μελλοντική ημερομηνία και ώρα Ελλάδας για τον προγραμματισμό." };
  }

  try {
    const { articleMediaExists, createAdminArticle, resolveAvailableArticleSlug } = await import("./repository");
    const normalized = { ...parsed.data, scheduledFor: parsed.data.status === "scheduled" ? parsed.data.scheduledFor : null };
    const input = formData.get("slugMode") === "auto"
      ? { ...normalized, slug: await resolveAvailableArticleSlug(suggestGreeklishSlug(parsed.data.title)) }
      : normalized;
    if (!await articleMediaExists(input)) return { error: "Επιλέξτε εικόνες που υπάρχουν στη media library και δώστε alt text στις εικόνες περιεχομένου." };
    const article = await createAdminArticle(input, session.user.id);
    revalidatePath("/admin/articles");
    if (parsed.data.status === "published") {
      revalidatePublication({ postSlug: article.slug, categorySlugs: article.categorySlugs });
    }
    const draftTemplate = formData.get("draftTemplate");
    const cleanupQuery = isArticleTemplateKey(draftTemplate) ? `?created=1&draftTemplate=${draftTemplate}` : "?created=1";
    redirect(`/admin/articles/${article.id}/edit${cleanupQuery}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "Η αποθήκευση απέτυχε. Ελέγξτε ότι το slug είναι μοναδικό." };
  }
}

export async function updateArticleAction(
  articleId: string,
  _state: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const session = await requireStaffSession();
  const repository = await import("./repository");
  const existing = await repository.findAdminArticle(articleId);
  if (!existing) return { error: "Το άρθρο δεν βρέθηκε." };
  const parsed = parseArticleFormData(formData, existing.slug);
  if (!parsed.success) return { error: validationMessage() };
  if (!mayEditArticle(session.user.role, session.user.id, existing.authorId)) {
    return { error: "Δεν έχετε δικαίωμα επεξεργασίας αυτού του άρθρου." };
  }
  if (!mayUseStatus(session.user.role, parsed.data.status)) {
    return { error: "Δεν έχετε δικαίωμα δημοσίευσης ή αρχειοθέτησης." };
  }
  if (parsed.data.status === "scheduled" && !isFutureSchedule(parsed.data.scheduledFor)) {
    return { error: "Επιλέξτε μελλοντική ημερομηνία και ώρα Ελλάδας για τον προγραμματισμό." };
  }
  try {
    const input = { ...parsed.data, scheduledFor: parsed.data.status === "scheduled" ? parsed.data.scheduledFor : null };
    if (!await repository.articleMediaExists(input)) return { error: "Επιλέξτε εικόνες που υπάρχουν στη media library και δώστε alt text στις εικόνες περιεχομένου." };
    const updated = await repository.updateAdminArticle(articleId, input, session.user.id);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    if (updated) {
      revalidatePublication({ postSlug: updated.existing.slug, categorySlugs: updated.categorySlugs });
      if (updated.slug !== updated.existing.slug) {
        revalidatePublication({ postSlug: updated.slug, categorySlugs: updated.categorySlugs });
      }
      if (updated.redirectFrom) {
        revalidatePublication({ postSlug: updated.redirectFrom, categorySlugs: updated.categorySlugs });
      }
    }
    redirect(`/admin/articles/${articleId}/edit?saved=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "Η ενημέρωση απέτυχε. Ελέγξτε ότι το slug είναι μοναδικό." };
  }
}

export async function restoreArticleRevisionAction(articleId: string, revisionNumber: number, _formData: FormData): Promise<void> {
  void _formData;
  const session = await requireCapability("article:edit-any");
  if (!/^[0-9a-f-]{36}$/i.test(articleId) || !Number.isInteger(revisionNumber) || revisionNumber < 1) {
    redirect(`/admin/articles/${articleId}/edit?restoreError=invalid`);
  }
  try {
    const { restoreAdminArticleRevision } = await import("./repository");
    const restored = await restoreAdminArticleRevision(articleId, revisionNumber, session.user.id);
    if (!restored) redirect("/admin/articles");
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    revalidatePublication({ postSlug: restored.slug, categorySlugs: restored.categorySlugs });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(`/admin/articles/${articleId}/edit?restoreError=failed`);
  }
  redirect(`/admin/articles/${articleId}/edit?restored=${revisionNumber}`);
}
