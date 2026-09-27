"use client";

import Link from "next/link";
import { cancelScheduledPublicationAction } from "@/features/admin-articles/publication-queue-actions";

export function PublicationQueueActions({ articleId }: { articleId: string }) {
  return <div className="admin-publication-queue__actions">
    <Link href={`/admin/articles/${articleId}/edit?step=4`}>Επαναπρογραμματισμός</Link>
    <form action={cancelScheduledPublicationAction} onSubmit={(event) => {
      if (!window.confirm("Να ακυρωθεί ο προγραμματισμός και να επιστρέψει το άρθρο στα πρόχειρα;")) event.preventDefault();
    }}><input type="hidden" name="articleId" value={articleId} /><button type="submit">Ακύρωση</button></form>
  </div>;
}
