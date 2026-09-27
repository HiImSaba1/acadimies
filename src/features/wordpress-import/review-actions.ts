"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { importStates } from "@/db/schema";
import { requireCapability } from "@/lib/auth/session";

const reviewInputSchema = z.object({
  id: z.uuid(),
  expectedState: z.enum(importStates),
  expectedChecksum: z.string().regex(/^[a-f0-9]{64}$/i),
  decision: z.enum(["approve", "exclude"]),
});

export type ImportReviewActionState = { status: "idle" | "success" | "error"; message: string };

export async function decideLegacyImportRecord(
  _state: ImportReviewActionState,
  formData: FormData,
): Promise<ImportReviewActionState> {
  const session = await requireCapability("migration:review");
  const parsed = reviewInputSchema.safeParse({
    id: formData.get("id"),
    expectedState: formData.get("expectedState"),
    expectedChecksum: formData.get("expectedChecksum"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { status: "error", message: "Η ενέργεια δεν είναι έγκυρη." };

  try {
    const { decideWordPressReview } = await import("./review-repository");
    const result = await decideWordPressReview({ ...parsed.data, actorId: session.user.id });
    if (result !== "updated") return {
      status: "error",
      message: result === "stale" ? "Η εγγραφή άλλαξε. Ανανεώστε τη σελίδα πριν συνεχίσετε." : "Η ενέργεια δεν επιτρέπεται για αυτή την εγγραφή.",
    };
    revalidatePath("/admin/imports");
    revalidatePath(`/admin/imports/${parsed.data.id}`);
    return { status: "success", message: "Η απόφαση αποθηκεύτηκε στο audit trail. Δεν δημοσιεύθηκε περιεχόμενο." };
  } catch {
    return { status: "error", message: "Η απόφαση δεν αποθηκεύτηκε. Δοκιμάστε ξανά." };
  }
}
