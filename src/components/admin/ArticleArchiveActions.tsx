"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteArticleAction } from "@/features/admin-articles/actions";

export function ArticleArchiveActions({ id, slug, title, year, canDelete }: {
  id: string; slug: string; title: string; year: number; canDelete: boolean;
}) {
  return <div className="admin-article-card__actions">
    <Link href={`/posts/${slug}`} target="_blank" rel="noopener noreferrer"
      aria-label={`Προβολή σε νέα καρτέλα: ${title}`} title="Προβολή σε νέα καρτέλα"><Eye aria-hidden="true" /></Link>
    <Link href={`/admin/articles/${id}/edit`} aria-label={`Επεξεργασία: ${title}`} title="Επεξεργασία"><Pencil aria-hidden="true" /></Link>
    {canDelete ? <form action={deleteArticleAction} onSubmit={(event) => {
      if (!window.confirm(`Να διαγραφεί οριστικά το άρθρο «${title}»; Τα κοινόχρηστα αρχεία εικόνων δεν θα διαγραφούν.`)) event.preventDefault();
    }}><input type="hidden" name="articleId" value={id} /><input type="hidden" name="returnYear" value={year} />
      <button type="submit" aria-label={`Διαγραφή: ${title}`} title="Διαγραφή"><Trash2 aria-hidden="true" /></button></form> : null}
  </div>;
}
