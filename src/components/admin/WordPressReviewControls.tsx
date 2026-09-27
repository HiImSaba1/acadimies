"use client";

import { useActionState } from "react";
import { decideLegacyImportRecord, type ImportReviewActionState } from "@/features/wordpress-import/review-actions";
import { canReviewLegacyRecord } from "@/features/wordpress-import/review-policy";
import type { ImportState } from "@/features/wordpress-import/stage";

const initialState: ImportReviewActionState = { status: "idle", message: "" };

export function WordPressReviewControls({ record }: {
  record: { id: string; state: ImportState; sourceType: string; checksumSha256: string; riskFlags: string[] };
}) {
  const [state, action, pending] = useActionState(decideLegacyImportRecord, initialState);
  const canApprove = canReviewLegacyRecord(record, "approve");
  const canExclude = canReviewLegacyRecord(record, "exclude");
  if (!canApprove && !canExclude) return <p className="admin-imports__locked">Αυτή η εγγραφή δεν έχει διαθέσιμη ενέργεια στο τρέχον στάδιο.</p>;

  return <form className="admin-imports__controls" action={action}>
    <input type="hidden" name="id" value={record.id} />
    <input type="hidden" name="expectedState" value={record.state} />
    <input type="hidden" name="expectedChecksum" value={record.checksumSha256} />
    {canApprove ? <button type="submit" name="decision" value="approve" disabled={pending}>Έγκριση για επόμενη φάση</button> : null}
    {canExclude ? <button type="submit" name="decision" value="exclude" disabled={pending}>Εξαίρεση από τη μεταφορά</button> : null}
    <p data-status={state.status} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
  </form>;
}
