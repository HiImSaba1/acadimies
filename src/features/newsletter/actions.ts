"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/auth/session";
import { parseCampaignDraft, parseNewsletterSignup } from "./contracts";

export type NewsletterSignupState = { status: "idle" | "success" | "error"; message: string };
export type CampaignDraftState = { status: "idle" | "success" | "error"; message: string };

export async function subscribeToNewsletter(_state: NewsletterSignupState, formData: FormData): Promise<NewsletterSignupState> {
  const parsed = parseNewsletterSignup(formData);
  if (!parsed.success) return { status: "error", message: "Συμπλήρωσε έγκυρο email και αποδέξου την ενημέρωση." };
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ipHash = forwarded ? createHash("sha256").update(forwarded).digest("hex") : null;
    const { requestNewsletterSubscription } = await import("./repository");
    const result = await requestNewsletterSubscription({ email: parsed.data.email, source: parsed.data.source, ipHash, userAgent: requestHeaders.get("user-agent") });
    return result.state === "confirmed"
      ? { status: "success", message: "Το email είναι ήδη επιβεβαιωμένο." }
      : { status: "success", message: "Έλεγξε το email σου για να επιβεβαιώσεις την εγγραφή." };
  } catch {
    return { status: "error", message: "Η εγγραφή δεν ολοκληρώθηκε. Δοκίμασε ξανά σε λίγο." };
  }
}

export async function createNewsletterCampaign(_state: CampaignDraftState, formData: FormData): Promise<CampaignDraftState> {
  const session = await requireCapability("newsletter:manage");
  const parsed = parseCampaignDraft(formData);
  if (!parsed.success) return { status: "error", message: "Έλεγξε τον τίτλο, το θέμα και το περιεχόμενο." };
  try {
    const { createCampaignDraft } = await import("./repository");
    await createCampaignDraft(parsed.data, session.user.id);
    revalidatePath("/admin/newsletter");
    return { status: "success", message: "Η καμπάνια αποθηκεύτηκε ως πρόχειρο. Δεν στάλθηκε κανένα email." };
  } catch {
    return { status: "error", message: "Η αποθήκευση απέτυχε. Δεν στάλθηκε κανένα email." };
  }
}
