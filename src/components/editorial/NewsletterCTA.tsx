"use client";

import { useActionState } from "react";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { subscribeToNewsletter, type NewsletterSignupState } from "@/features/newsletter/actions";

const initialState: NewsletterSignupState = { status: "idle", message: "" };

export function NewsletterCTA({ compact = false, source = "homepage", outcome }: { compact?: boolean; source?: "homepage" | "footer"; outcome?: NewsletterSignupState | null }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, outcome ?? initialState);
  const emailId = `newsletter-email-${source}`;

  return (
    <form className="newsletter-cta__form" data-compact={compact || undefined} action={action} aria-label="Εγγραφή στο newsletter">
      <input type="hidden" name="source" value={source} />
      {!compact ? <label htmlFor={emailId}>Το email σου</label> : null}
      <input className="newsletter-cta__honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div><input id={emailId} name="email" type="email" autoComplete="email" placeholder="name@example.gr" aria-label={compact ? "Το email σας" : undefined} required /><EditorialButton type="submit" label={pending ? "Αποθήκευση…" : compact ? "Newsletter" : "Ενημέρωσέ με"} arrow="right" variant={compact ? "dark" : "light"} disabled={pending} /></div>
      <label className="newsletter-cta__consent"><input name="consent" type="checkbox" required /><span>Συμφωνώ να λαμβάνω επιλεγμένες ενημερώσεις. Μπορώ να διαγραφώ οποιαδήποτε στιγμή. Η εγγραφή ενεργοποιείται μόνο μετά την επιβεβαίωση του email.</span></label>
      <p className="newsletter-cta__status" data-status={state.status} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{state.message}</p>
    </form>
  );
}
