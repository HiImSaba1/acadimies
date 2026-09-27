"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster, toast } from "sonner";
import type { z } from "zod";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { editorialProposalSchema, simpleContactSchema } from "@/features/contact/contracts";
import { sendEditorialContact } from "@/features/contact/actions";

type MessageData = z.infer<typeof simpleContactSchema>;
type ProposalData = z.infer<typeof editorialProposalSchema>;
const contributionOptions = [
  ["NEWS", "ΕΙΔΗΣΗ"], ["OPINION", "ΑΡΘΡΟ ΓΝΩΜΗΣ"], ["INTERVIEW", "ΣΥΝΕΝΤΕΥΞΗ"],
  ["EVENT", "ΔΙΟΡΓΑΝΩΣΗ"], ["OTHER", "ΑΛΛΟ"],
] as const;

function submitWithToast<T>(request: Promise<T>, success: string) {
  toast.promise(request, { loading: "Αποστολή μηνύματος…", success,
    error: (error) => error instanceof Error ? error.message : "Η αποστολή απέτυχε." });
  return request.catch(() => undefined);
}

export function SimpleContactForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid } } = useForm<MessageData>({
    resolver: zodResolver(simpleContactSchema), mode: "onChange",
    defaultValues: { submissionType: "MESSAGE", name: "", email: "", phone: "", message: "", website: "", consent: false },
  });
  const submit = handleSubmit(async (data) => {
    const request = sendEditorialContact(data).then((result) => { if (!result.success) throw new Error(result.error); reset(); return result; });
    await submitWithToast(request, "Το μήνυμα στάλθηκε με επιτυχία.");
  });
  const error = (name: keyof MessageData) => errors[name] ? <span className="contact-form__error">ΕΛΕΓΞΕ ΤΟ ΠΕΔΙΟ</span> : null;
  return <form className="contact-form contact-form--simple" onSubmit={submit} aria-label="Απλή φόρμα επικοινωνίας">
    <input {...register("submissionType")} type="hidden" /><input {...register("website")} className="contact-form__honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="contact-form__pair">
      <label><span>ΤΟ ΟΝΟΜΑ ΜΟΥ ΕΙΝΑΙ*</span><input {...register("name")} type="text" placeholder="ΟΝΟΜΑΤΕΠΩΝΥΜΟ" autoComplete="name" />{error("name")}</label>
      <label><span>ΤΟ EMAIL ΜΟΥ ΕΙΝΑΙ*</span><input {...register("email")} type="email" placeholder="EMAIL@ADDRESS.COM" autoComplete="email" />{error("email")}</label>
    </div>
    <label><span>ΤΟ ΜΗΝΥΜΑ ΜΟΥ*</span><textarea {...register("message")} rows={3} placeholder="ΠΩΣ ΜΠΟΡΟΥΜΕ ΝΑ ΒΟΗΘΗΣΟΥΜΕ;" />{error("message")}</label>
    <div className="contact-form__actions"><label className="contact-form__consent"><input {...register("consent")} type="checkbox" /><span>Συμφωνώ να χρησιμοποιηθούν τα στοιχεία μου αποκλειστικά για την απάντηση στο μήνυμά μου.</span>{error("consent")}</label>
      <div className="contact-form__submit"><EditorialButton type="submit" label={isSubmitting ? "ΑΠΟΣΤΟΛΗ…" : "ΣΤΕΙΛΕ ΜΗΝΥΜΑ"} arrow="right" disabled={!isValid || isSubmitting} /></div></div>
  </form>;
}

export function ArticleProposalForm() {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { register, handleSubmit, setValue, control, reset, formState: { errors, isSubmitting, isValid } } = useForm<ProposalData>({
    resolver: zodResolver(editorialProposalSchema), mode: "onChange",
    defaultValues: { submissionType: "ARTICLE_IDEA", name: "", email: "", phone: "", proposedTitle: "", message: "", website: "", consent: false },
  });
  const selectedType = useWatch({ control, name: "contributionType" });
  const selectedLabel = contributionOptions.find(([value]) => value === selectedType)?.[1];
  const submit = handleSubmit(async (data) => {
    const request = sendEditorialContact(data).then((result) => { if (!result.success) throw new Error(result.error); reset(); return result; });
    await submitWithToast(request, "Η πρόταση στάλθηκε στη συντακτική ομάδα.");
  });
  const error = (name: keyof ProposalData) => errors[name] ? <span className="contact-form__error">ΕΛΕΓΞΕ ΤΟ ΠΕΔΙΟ</span> : null;
  return <form className="contact-form contact-form--editorial" onSubmit={submit} aria-label="Φόρμα πρότασης άρθρου">
    <input {...register("submissionType")} type="hidden" /><input {...register("website")} className="contact-form__honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="contact-form__pair">
      <label><span>ΤΟ ΟΝΟΜΑ ΜΟΥ ΕΙΝΑΙ*</span><input {...register("name")} type="text" placeholder="ΟΝΟΜΑΤΕΠΩΝΥΜΟ" autoComplete="name" />{error("name")}</label>
      <label className="contact-form__select"><span>ΘΕΛΩ ΝΑ ΠΡΟΤΕΙΝΩ*</span><button type="button" aria-label={selectedLabel ? `Τύπος πρότασης: ${selectedLabel}` : "ΕΠΙΛΕΞΕ ΚΑΤΗΓΟΡΙΑ"} aria-haspopup="listbox" aria-controls="proposal-type-options" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((value) => !value)}><span>{selectedLabel ?? "ΕΠΙΛΕΞΕ ΚΑΤΗΓΟΡΙΑ"}</span><b aria-hidden="true">↓</b></button>{error("contributionType")}
        {optionsOpen ? <div id="proposal-type-options" role="listbox" aria-label="Τύπος πρότασης">{contributionOptions.map(([value, label]) => <button key={value} type="button" role="option" aria-selected={selectedType === value} onClick={() => { setValue("contributionType", value, { shouldValidate: true }); setOptionsOpen(false); }}>{label}</button>)}</div> : null}</label>
    </div>
    <div className="contact-form__pair">
      <label><span>ΤΟ EMAIL ΜΟΥ ΕΙΝΑΙ*</span><input {...register("email")} type="email" placeholder="EMAIL@ADDRESS.COM" autoComplete="email" />{error("email")}</label>
      <label><span>ΤΟ ΤΗΛΕΦΩΝΟ ΜΟΥ</span><input {...register("phone")} type="tel" inputMode="tel" placeholder="ΠΡΟΑΙΡΕΤΙΚΟ" autoComplete="tel" /></label>
    </div>
    <label><span>ΠΡΟΤΕΙΝΟΜΕΝΟΣ ΤΙΤΛΟΣ*</span><input {...register("proposedTitle")} type="text" placeholder="ΕΝΑΣ ΣΥΝΤΟΜΟΣ ΤΙΤΛΟΣ ΓΙΑ ΤΗΝ ΙΣΤΟΡΙΑ" />{error("proposedTitle")}</label>
    <label><span>ΠΕΣ ΜΑΣ ΤΗΝ ΙΣΤΟΡΙΑ*</span><textarea {...register("message")} rows={3} placeholder="ΤΙ ΣΥΝΕΒΗ, ΓΙΑΤΙ ΑΦΟΡΑ ΤΙΣ ΑΚΑΔΗΜΙΕΣ ΚΑΙ ΠΟΙΑ ΣΤΟΙΧΕΙΑ ΜΠΟΡΕΙΣ ΝΑ ΜΟΙΡΑΣΤΕΙΣ;" />{error("message")}</label>
    <div className="contact-form__actions"><label className="contact-form__consent"><input {...register("consent")} type="checkbox" /><span>Συμφωνώ να χρησιμοποιηθούν τα στοιχεία μου αποκλειστικά για απάντηση και αξιολόγηση της πρότασης.</span>{error("consent")}</label>
      <div className="contact-form__submit"><EditorialButton type="submit" label={isSubmitting ? "ΑΠΟΣΤΟΛΗ…" : "ΣΤΕΙΛΕ ΤΗΝ ΠΡΟΤΑΣΗ"} arrow="right" disabled={!isValid || isSubmitting} /></div></div>
  </form>;
}

export function ContactForm() {
  return <div className="contact-form-stack"><Toaster position="bottom-left" richColors />
    <section className="contact-form-panel" aria-labelledby="simple-contact-title"><header><span>01</span><div><h2 id="simple-contact-title">Στείλε ένα μήνυμα</h2><p>Για μια ερώτηση, συνεργασία ή οτιδήποτε θέλεις να συζητήσουμε.</p></div></header><SimpleContactForm /></section>
    <section className="contact-form-panel" aria-labelledby="article-proposal-title"><header><span>02</span><div><h2 id="article-proposal-title">Πρότεινε ένα άρθρο</h2><p>Μοιράσου μια είδηση, συνέντευξη, διοργάνωση ή ιδέα με τη συντακτική ομάδα.</p></div></header><ArticleProposalForm /></section>
  </div>;
}
