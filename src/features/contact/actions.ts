"use server";

import { contactSubmissionSchema } from "./contracts";

export async function sendEditorialContact(raw: unknown): Promise<{ success: boolean; error?: string }> {
  const parsed = contactSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Έλεγξε τα υποχρεωτικά πεδία και γράψε ένα μήνυμα τουλάχιστον 30 χαρακτήρων." };
  }
  try {
    const { sendEditorialProposal } = await import("@/lib/email/contact-delivery");
    await sendEditorialProposal(parsed.data);
    return { success: true };
  } catch {
    return { success: false, error: "Η αποστολή απέτυχε. Δοκίμασε ξανά ή γράψε στο info@acadimies.gr." };
  }
}
