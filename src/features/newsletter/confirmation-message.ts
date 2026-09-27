import { z } from "zod";

export const doubleOptInPayloadSchema = z.object({
  confirmationToken: z.string().min(32).max(256),
  unsubscribeToken: z.string().min(32).max(256),
  expiresAt: z.string().datetime(),
});

export type DoubleOptInPayload = z.infer<typeof doubleOptInPayloadSchema>;

export function newsletterPublicOrigin(value?: string): string {
  const candidate = value?.trim() || "https://acadimies.gr";
  const url = new URL(candidate);
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("Newsletter public origin must use HTTPS.");
  url.pathname = "/"; url.search = ""; url.hash = "";
  return url.origin;
}

export function buildDoubleOptInMessage(payload: DoubleOptInPayload, originValue?: string) {
  const origin = newsletterPublicOrigin(originValue);
  const confirmationUrl = new URL("/api/newsletter/confirm", origin);
  confirmationUrl.searchParams.set("token", payload.confirmationToken);
  const unsubscribeUrl = new URL("/api/newsletter/unsubscribe", origin);
  unsubscribeUrl.searchParams.set("token", payload.unsubscribeToken);
  return {
    subject: "Επιβεβαίωσε την εγγραφή σου στο Newsletter της Ακαδημίες",
    text: `Επιβεβαίωσε την εγγραφή σου:\n${confirmationUrl.href}\n\nΑν δεν έκανες εσύ το αίτημα, αγνόησε αυτό το email ή ακύρωσε το αίτημα:\n${unsubscribeUrl.href}`,
    html: `<h1>Μείνε κοντά στο παιχνίδι</h1><p>Επιβεβαίωσε την εγγραφή σου στο Newsletter της Ακαδημίες.</p><p><a href="${confirmationUrl.href}">Επιβεβαίωση εγγραφής</a></p><p>Αν δεν έκανες εσύ το αίτημα, μπορείς να το αγνοήσεις ή να <a href="${unsubscribeUrl.href}">ακυρώσεις το αίτημα</a>.</p>`,
  };
}

export type NewsletterOutcome = "confirmed" | "unsubscribed" | "invalid";
export function newsletterOutcomeMessage(value: string | string[] | undefined): { status: "success" | "error"; message: string } | null {
  const outcome = Array.isArray(value) ? value[0] : value;
  if (outcome === "confirmed") return { status: "success", message: "Η εγγραφή επιβεβαιώθηκε. Καλώς ήρθες στο Newsletter." };
  if (outcome === "unsubscribed") return { status: "success", message: "Η διαγραφή από το Newsletter ολοκληρώθηκε." };
  if (outcome === "invalid") return { status: "error", message: "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει." };
  return null;
}
