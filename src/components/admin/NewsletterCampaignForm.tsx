"use client";

import { useActionState } from "react";
import { createNewsletterCampaign, type CampaignDraftState } from "@/features/newsletter/actions";

const initialState: CampaignDraftState = { status: "idle", message: "" };

export function NewsletterCampaignForm() {
  const [state, action, pending] = useActionState(createNewsletterCampaign, initialState);
  return <form className="admin-campaign-form" action={action}>
    <header><div><p>Νέα καμπάνια</p><h2>Πρόχειρη ενημέρωση</h2></div><span>Δεν πραγματοποιείται αποστολή</span></header>
    <label htmlFor="campaign-title">Εσωτερικός τίτλος</label><input id="campaign-title" name="title" required minLength={3} maxLength={191} />
    <label htmlFor="campaign-subject">Θέμα email</label><input id="campaign-subject" name="subject" required minLength={3} maxLength={255} />
    <label htmlFor="campaign-preview">Preview text</label><input id="campaign-preview" name="previewText" maxLength={320} />
    <label htmlFor="campaign-body">Περιεχόμενο</label><textarea id="campaign-body" name="body" required minLength={10} rows={8} />
    <button type="submit" disabled={pending}>{pending ? "Αποθήκευση…" : "Αποθήκευση ως πρόχειρο"}</button>
    <p data-status={state.status} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
  </form>;
}
