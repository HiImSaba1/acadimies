"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import type { StaffRole } from "@/db/schema";
import { articleTemplateKeys, headerTemplateKeys } from "@/db/schema";
import type { ArticleActionState } from "@/features/admin-articles/actions";
import { articleDocumentSchema, type ArticleDocument } from "@/features/articles/document";
import { suggestGreeklishSlug } from "@/features/admin-articles/greeklish-slug";
import { activeArticleTemplateKeys, articleTemplateCatalog, isActiveArticleTemplateKey } from "@/features/admin-articles/template-catalog";
import { ArticleBlockEditor } from "@/components/admin/ArticleBlockEditor";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ProofreadingHints } from "@/components/admin/ProofreadingHints";
import type { MediaAssetOption } from "@/features/admin-articles/media-contracts";

type ArticleEditorValue = {
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "review" | "scheduled" | "published" | "archived";
  scheduledFor: string;
  headerTemplate: (typeof headerTemplateKeys)[number] | null;
  articleTemplate: (typeof articleTemplateKeys)[number];
  categoryId: string | null;
  featuredMediaId: string | null;
  secondaryMediaId: string | null;
  seoTitle: string;
  seoDescription: string;
  tagIds: string[];
  contentDocument: ArticleDocument;
};

type Props = {
  mode: "create" | "edit";
  draftKey: string;
  clearDraftKey?: string;
  revisions?: { revisionNumber: number; changeSummary: string | null; createdAt: string; editorName: string | null }[];
  redirects?: { sourceSlug: string; createdAt: string }[];
  restoreAction?: (revisionNumber: number, formData: FormData) => Promise<void>;
  restoredRevision?: number;
  restoreError?: boolean;
  action: (state: ArticleActionState, formData: FormData) => Promise<ArticleActionState>;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  mediaAssets?: MediaAssetOption[];
  role: StaffRole;
  value: ArticleEditorValue;
  initialStep?: 1 | 2 | 3 | 4 | 5;
};

type ArticleJsonPayload = {
  schemaVersion?: unknown;
  article?: Partial<ArticleEditorValue> & { newTags?: unknown };
};
type PendingJsonImport = {
  value: ArticleEditorValue;
  newTags: string;
  changes: string[];
  warnings: string[];
};
type HeaderTemplateValue = ArticleEditorValue["headerTemplate"];
type ArticleStatusValue = ArticleEditorValue["status"];

function articleJsonTemplate(value: ArticleEditorValue, newTags: string) {
  return {
    schemaVersion: 1,
    purpose: "Acadimies admin article import. Fill the article object, keep media fields as existing media UUIDs, then upload this JSON in the editor.",
    templateGuidance: {
      selectedTemplate: value.articleTemplate,
      activeTemplates: activeArticleTemplateKeys,
      contentDocument: "Use blocks: paragraph, heading, quote, question, cta, image, chapter. Image and chapter blocks require mediaId and alt.",
      imageWorkflow: "Do not embed image files in JSON. Upload/select images in the editor media picker, then reference their media IDs here if needed.",
    },
    article: {
      title: value.title || "Τίτλος άρθρου",
      slug: value.slug || "greeklish-slug",
      excerpt: value.excerpt || "Σύντομη περιγραφή για κάρτες και λίστες.",
      status: value.status,
      scheduledFor: value.scheduledFor,
      headerTemplate: value.headerTemplate,
      articleTemplate: value.articleTemplate,
      categoryId: value.categoryId,
      featuredMediaId: value.featuredMediaId,
      secondaryMediaId: value.secondaryMediaId,
      seoTitle: value.seoTitle,
      seoDescription: value.seoDescription,
      tagIds: value.tagIds,
      newTags,
      contentDocument: value.contentDocument,
    },
  };
}

function pickString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function pickNullableString(value: unknown, fallback: string | null) {
  return typeof value === "string" && value ? value : value === null ? null : fallback;
}

function validStatus(value: unknown): value is ArticleStatusValue {
  return typeof value === "string" && ["draft", "review", "scheduled", "published", "archived"].includes(value);
}

function collectImportChanges(current: ArticleEditorValue, next: ArticleEditorValue, currentNewTags: string, nextNewTags: string) {
  const changes = [
    current.articleTemplate !== next.articleTemplate ? `Template: ${current.articleTemplate} → ${next.articleTemplate}` : null,
    current.title !== next.title ? "Τίτλος άρθρου" : null,
    current.slug !== next.slug ? "Slug" : null,
    current.excerpt !== next.excerpt ? "Σύντομη περιγραφή" : null,
    current.status !== next.status ? `Κατάσταση: ${current.status} → ${next.status}` : null,
    current.scheduledFor !== next.scheduledFor ? "Προγραμματισμός" : null,
    current.headerTemplate !== next.headerTemplate ? "Header override" : null,
    current.categoryId !== next.categoryId ? "Κατηγορία" : null,
    current.featuredMediaId !== next.featuredMediaId ? "Κεντρική εικόνα" : null,
    current.secondaryMediaId !== next.secondaryMediaId ? "Δευτερεύουσα εικόνα" : null,
    current.seoTitle !== next.seoTitle ? "SEO τίτλος" : null,
    current.seoDescription !== next.seoDescription ? "SEO περιγραφή" : null,
    current.tagIds.join(",") !== next.tagIds.join(",") || currentNewTags !== nextNewTags ? "Tags / keywords" : null,
    JSON.stringify(current.contentDocument) !== JSON.stringify(next.contentDocument) ? "Δομημένο περιεχόμενο" : null,
  ].filter((item): item is string => Boolean(item));
  return changes.length ? changes : ["Δεν εντοπίστηκαν αλλαγές στα υποστηριζόμενα πεδία."];
}

export function ArticleEditor({ mode, draftKey, clearDraftKey, revisions = [], redirects = [], restoreAction, restoredRevision, restoreError = false, action, categories, tags, mediaAssets = [], role, value, initialStep }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const canPublish = role === "owner" || role === "editor";
  const [title, setTitle] = useState(value.title);
  const [slug, setSlug] = useState(value.slug);
  const [manualSlug, setManualSlug] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(value.excerpt);
  const [featuredMediaId, setFeaturedMediaId] = useState(value.featuredMediaId);
  const [secondaryMediaId, setSecondaryMediaId] = useState(value.secondaryMediaId);
  const [seoTitle, setSeoTitle] = useState(value.seoTitle);
  const [seoDescription, setSeoDescription] = useState(value.seoDescription);
  const [articleTemplate, setArticleTemplate] = useState(value.articleTemplate);
  const [status, setStatus] = useState(value.status);
  const [scheduledFor, setScheduledFor] = useState(value.scheduledFor);
  const [headerTemplate, setHeaderTemplate] = useState(value.headerTemplate);
  const [categoryId, setCategoryId] = useState(value.categoryId);
  const [selectedTagIds, setSelectedTagIds] = useState(value.tagIds);
  const [newTags, setNewTags] = useState("");
  const [contentDocument, setContentDocument] = useState(value.contentDocument);
  const [tagSearch, setTagSearch] = useState("");
  const [jsonStatus, setJsonStatus] = useState("");
  const [pendingJsonImport, setPendingJsonImport] = useState<PendingJsonImport | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(initialStep ?? (mode === "create" ? 2 : 1));
  const wizardSteps = ["Template", "Βασικά", "Περιεχόμενο", "Ρυθμίσεις", "Έλεγχος"];
  const normalizedTagSearch = tagSearch.trim().toLocaleLowerCase("el-GR");
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const matchingTags = tags.filter((tag) => tag.name.toLocaleLowerCase("el-GR").includes(normalizedTagSearch));
  const visibleTags = [...selectedTags, ...matchingTags].filter((tag, index, all) => all.findIndex((candidate) => candidate.id === tag.id) === index).slice(0, Math.max(80, selectedTags.length));
  const currentValue: ArticleEditorValue = {
    title, slug, excerpt, status, scheduledFor, headerTemplate, articleTemplate, categoryId,
    featuredMediaId, secondaryMediaId, seoTitle, seoDescription, tagIds: selectedTagIds, contentDocument,
  };

  function downloadJsonTemplate() {
    const blob = new Blob([`${JSON.stringify(articleJsonTemplate(currentValue, newTags), null, 2)}\n`], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${articleTemplate}-acadimies-post-template.json`;
    link.click();
    URL.revokeObjectURL(href);
    setJsonStatus("Το JSON template κατέβηκε για το επιλεγμένο article template.");
  }

  async function copyAiPrompt() {
    const prompt = [
      "You are preparing an Acadimies article JSON file for the admin editor.",
      "Fill the article object only. Keep schemaVersion and templateGuidance.",
      `Selected articleTemplate: ${articleTemplate}. Use this template's structure and tone.`,
      "Write Greek editorial copy. Keep status as draft unless explicitly instructed otherwise.",
      "Do not invent media IDs. Use null for featuredMediaId/secondaryMediaId unless an exact media UUID is supplied.",
      "Do not embed image binaries. Images are uploaded or selected inside the Acadimies editor.",
      "Return only valid JSON, no markdown fences.",
      JSON.stringify(articleJsonTemplate(currentValue, newTags), null, 2),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setJsonStatus("Το AI prompt αντιγράφηκε.");
    } catch {
      setJsonStatus("Δεν ήταν δυνατή η αντιγραφή. Χρησιμοποίησε το downloaded JSON template.");
    }
  }

  function stageJsonImport(payload: ArticleJsonPayload): PendingJsonImport {
    const article = payload.article;
    if (!article || typeof article !== "object") throw new Error("Missing article object.");
    const nextTemplate = isActiveArticleTemplateKey(article.articleTemplate) ? article.articleTemplate : articleTemplate;
    const nextStatus = validStatus(article.status) ? article.status : status;
    const safeStatus = canPublish ? nextStatus : nextStatus === "published" || nextStatus === "scheduled" || nextStatus === "archived" ? "draft" : nextStatus;
    const parsedDocument = article.contentDocument === undefined
      ? { success: true as const, data: contentDocument }
      : articleDocumentSchema.safeParse(article.contentDocument);
    if (!parsedDocument.success) throw new Error("Invalid contentDocument.");

    const nextHeaderTemplate: HeaderTemplateValue = headerTemplateKeys.some((key) => key === article.headerTemplate)
      ? article.headerTemplate as HeaderTemplateValue : article.headerTemplate === null ? null : headerTemplate;
    const nextTagIds = Array.isArray(article.tagIds)
      ? article.tagIds.filter((id): id is string => typeof id === "string" && tags.some((tag) => tag.id === id)).slice(0, 20)
      : selectedTagIds;
    const nextNewTags = typeof article.newTags === "string" ? article.newTags : newTags;
    const nextCategoryId = typeof article.categoryId === "string" && categories.some((category) => category.id === article.categoryId)
      ? article.categoryId : article.categoryId === null ? null : categoryId;
    const nextValue: ArticleEditorValue = {
      title: pickString(article.title, title),
      slug: pickString(article.slug, slug),
      excerpt: pickString(article.excerpt, excerpt),
      status: safeStatus,
      scheduledFor: pickString(article.scheduledFor, scheduledFor),
      headerTemplate: nextHeaderTemplate,
      articleTemplate: nextTemplate,
      categoryId: nextCategoryId,
      featuredMediaId: pickNullableString(article.featuredMediaId, featuredMediaId),
      secondaryMediaId: pickNullableString(article.secondaryMediaId, secondaryMediaId),
      seoTitle: pickString(article.seoTitle, seoTitle),
      seoDescription: pickString(article.seoDescription, seoDescription),
      tagIds: nextTagIds,
      contentDocument: parsedDocument.data,
    };
    const warnings = [
      nextValue.title.trim().length < 5 ? "Ο τίτλος είναι μικρός και θα απορριφθεί στην αποθήκευση." : null,
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nextValue.slug) ? "Το slug πρέπει να είναι latin lowercase με παύλες." : null,
      nextValue.featuredMediaId && !mediaAssets.some((asset) => asset.id === nextValue.featuredMediaId) ? "Η κεντρική εικόνα δεν υπάρχει στα media που είναι φορτωμένα τώρα. Έλεγξέ τη στη βιβλιοθήκη." : null,
      nextValue.secondaryMediaId && !mediaAssets.some((asset) => asset.id === nextValue.secondaryMediaId) ? "Η δευτερεύουσα εικόνα δεν υπάρχει στα media που είναι φορτωμένα τώρα. Έλεγξέ τη στη βιβλιοθήκη." : null,
      !canPublish && nextStatus !== safeStatus ? "Η κατάσταση δημοσίευσης υποβαθμίστηκε σε draft επειδή ο ρόλος δεν έχει publish permission." : null,
    ].filter((item): item is string => Boolean(item));
    return { value: nextValue, newTags: nextNewTags, changes: collectImportChanges(currentValue, nextValue, newTags, nextNewTags), warnings };
  }

  async function importJsonFile(file: File | null) {
    if (!file) return;
    setJsonStatus("");
    setPendingJsonImport(null);
    try {
      const payload = JSON.parse(await file.text()) as ArticleJsonPayload;
      const pending = stageJsonImport(payload);
      setPendingJsonImport(pending);
      setJsonStatus("Το JSON ελέγχθηκε. Πάτησε εφαρμογή για να γεμίσει η φόρμα.");
    } catch {
      setJsonStatus("Το JSON δεν πέρασε τον έλεγχο. Θέλει article object και έγκυρο contentDocument.");
    }
  }

  function applyPendingJsonImport() {
    if (!pendingJsonImport) return;
    const next = pendingJsonImport.value;
    setArticleTemplate(next.articleTemplate);
    setTitle(next.title);
    setSlug(next.slug);
    setManualSlug(Boolean(next.slug));
    setExcerpt(next.excerpt);
    setStatus(next.status);
    setScheduledFor(next.scheduledFor);
    setHeaderTemplate(next.headerTemplate);
    setCategoryId(next.categoryId);
    setFeaturedMediaId(next.featuredMediaId);
    setSecondaryMediaId(next.secondaryMediaId);
    setSeoTitle(next.seoTitle);
    setSeoDescription(next.seoDescription);
    setSelectedTagIds(next.tagIds);
    setNewTags(pendingJsonImport.newTags);
    setContentDocument(next.contentDocument);
    setPendingJsonImport(null);
    setJsonStatus("Το JSON εφαρμόστηκε στη φόρμα. Κάνε τελικό έλεγχο πριν την αποθήκευση.");
  }

  return (
    <form className="article-editor" action={formAction} noValidate data-wizard-step={wizardStep}>
      <input type="hidden" name="slugMode" value={manualSlug ? "manual" : "auto"} />
      <input type="hidden" name="articleTemplate" value={articleTemplate} />
      <input type="hidden" name="featuredMediaId" value={featuredMediaId ?? ""} />
      <input type="hidden" name="secondaryMediaId" value={secondaryMediaId ?? ""} />
      {mode === "create" ? <input type="hidden" name="draftTemplate" value={articleTemplate} /> : null}
      <div className="article-editor__heading">
        <div><Link href="/admin/articles" className="article-editor__back">← Όλα τα άρθρα</Link><p>Συντακτικό περιβάλλον / {mode === "create" ? "Νέο άρθρο" : "Επεξεργασία"}</p><AnimatedHeadline as="h1">{mode === "create" ? "Γράψε μια νέα ιστορία." : "Επεξεργασία ιστορίας"}</AnimatedHeadline></div>
        <div className="article-editor__actions"><span>Βήμα 0{wizardStep} / 05</span>{wizardStep === 5 ? <button type="submit" disabled={pending}>{pending ? "Αποθήκευση…" : "Αποθήκευση άρθρου ↗"}</button> : null}</div>
      </div>
      {state.error ? <p className="article-editor__error" role="alert">{state.error}</p> : null}
      {restoredRevision ? <p className="article-editor__notice" role="status">Η έκδοση #{restoredRevision} επαναφέρθηκε. Η προηγούμενη κατάσταση αποθηκεύτηκε στο ιστορικό.</p> : null}
      {restoreError ? <p className="article-editor__error" role="alert">Η επαναφορά απέτυχε. Η έκδοση μπορεί να είναι παλιά, ελλιπής ή να αναφέρεται σε αρχεία που δεν υπάρχουν πλέον.</p> : null}
      <section className="article-editor__json-tools" aria-label="JSON εισαγωγή και εξαγωγή άρθρου">
        <div><strong>AI JSON workflow</strong></div>
        <button type="button" onClick={downloadJsonTemplate}>Download JSON template</button>
        <button type="button" onClick={() => { void copyAiPrompt(); }}>Copy AI prompt</button>
        <label>Upload JSON<input type="file" accept="application/json,.json" onChange={(event) => { void importJsonFile(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label>
        {jsonStatus ? <p role="status">{jsonStatus}</p> : null}
        {pendingJsonImport ? <div className="article-editor__json-review">
          <strong>Έλεγχος εισαγωγής</strong>
          <ul>{pendingJsonImport.changes.map((change) => <li key={change}>{change}</li>)}</ul>
          {pendingJsonImport.warnings.length ? <div role="alert"><span>Προειδοποιήσεις</span><ul>{pendingJsonImport.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
          <div><button type="button" onClick={applyPendingJsonImport}>Εφαρμογή JSON στη φόρμα</button><button type="button" onClick={() => setPendingJsonImport(null)}>Ακύρωση εισαγωγής</button></div>
        </div> : null}
      </section>
      <nav className="article-editor__wizard-progress" aria-label={mode === "create" ? "Βήματα δημιουργίας άρθρου" : "Βήματα επεξεργασίας άρθρου"}>{wizardSteps.map((label, index) => {
        const step = index + 1;
        return mode === "create" && step === 1 ? <Link key={label} href="/admin/articles/new" aria-current={wizardStep === step ? "step" : undefined}><span>0{step}</span>{label}</Link>
          : <button key={label} type="button" onClick={() => setWizardStep(step)} aria-current={wizardStep === step ? "step" : undefined}><span>0{step}</span>{label}</button>;
      })}</nav>
      <div className="article-editor__grid">
        <section className="article-editor__canvas" hidden={wizardStep === 4}>
          {mode === "edit" ? <div className="article-editor__wizard-panel" hidden={wizardStep !== 1}>
            <p className="article-editor__eyebrow">Template αφήγησης</p><h2>Διάλεξε τον τρόπο παρουσίασης.</h2>
            <div className="article-editor__template-grid" role="radiogroup" aria-label="Template άρθρου">
              {activeArticleTemplateKeys.map((key) => <label key={key} data-selected={articleTemplate === key || undefined}>
                <input type="radio" checked={articleTemplate === key} onChange={() => setArticleTemplate(key)} />
                <div className={`admin-template-picker__visual admin-template-picker__visual--${articleTemplateCatalog[key].visual}`} aria-hidden="true"><i /><i /><i /><i /></div>
                <strong>{articleTemplateCatalog[key].label}</strong><small>{articleTemplateCatalog[key].description}</small>
              </label>)}
            </div>
            {!isActiveArticleTemplateKey(articleTemplate) ? <p className="article-proofreading">Το παλιό template διατηρείται μόνο για συμβατότητα. Επίλεξε ένα από τα ενεργά templates πριν από την επόμενη δημοσίευση.</p> : null}
          </div> : null}
          <div className="article-editor__wizard-panel" hidden={wizardStep !== 2}>
          <p className="article-editor__eyebrow">Τίτλος / ιστορία</p>
          <label htmlFor="article-title">Τίτλος άρθρου</label>
          <input id="article-title" className="article-editor__title-input" name="title" value={title} onChange={(event) => { const next = event.target.value; setTitle(next); if (!manualSlug) setSlug(next ? suggestGreeklishSlug(next) : ""); }} minLength={5} maxLength={512} placeholder="Ποια ιστορία θέλεις να πεις;" lang="el" spellCheck required />
          <ProofreadingHints text={title} />
          <label htmlFor="article-slug">Διεύθυνση άρθρου (Greeklish)</label>
          <div className="article-editor__slug"><span>/posts/</span><input id="article-slug" name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setManualSlug(true); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={191} placeholder="Αυτόματη πρόταση από τον τίτλο" /></div>
          <small>{manualSlug ? (mode === "edit" ? "Χειροκίνητο slug. Αν αλλάξει σε δημοσιευμένο άρθρο, η παλιά διεύθυνση θα διατηρηθεί ως μόνιμο SEO redirect." : "Χειροκίνητο slug. Η αλλαγή του τίτλου δεν θα το αντικαταστήσει.") : "Ο τίτλος προτείνει αυτόματα Greeklish slug. Μπορείς να το αλλάξεις."}</small>
          {mode === "edit" && redirects.length ? <div className="article-editor__redirects"><strong>Ιστορικό διευθύνσεων</strong><ul>{redirects.map((item) => <li key={item.sourceSlug}><code>/posts/{item.sourceSlug}</code><span>→ /posts/{value.slug}</span></li>)}</ul></div> : null}
          <label htmlFor="article-excerpt">Σύντομη περιγραφή</label>
          <textarea id="article-excerpt" name="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={4} maxLength={1000} lang="el" spellCheck placeholder="Μια εισαγωγή που θα συνοδεύει το άρθρο στις κάρτες." />
          <ProofreadingHints text={excerpt} />
          </div>
          <div className="article-editor__wizard-panel" hidden={wizardStep !== 3}>
          <div className="article-editor__content-heading"><div><h2>Περιεχόμενο άρθρου</h2><p>Δομημένα blocks με οπτική προεπισκόπηση και μορφοποίηση.</p></div><span>BLOCKS / 09B</span></div>
          <ArticleBlockEditor initialDocument={value.contentDocument} document={contentDocument} onDocumentChange={setContentDocument} draftKey={draftKey} clearDraftKey={clearDraftKey} initialMediaAssets={mediaAssets} />
          <small>Το τοπικό πρόχειρο προστατεύει από απώλεια στον browser. Η αποθήκευση στη βάση δημιουργεί νέο revision μόνο όταν πατήσεις «Αποθήκευση άρθρου».</small>
          </div>
          {wizardStep === 5 ? <div className="article-editor__wizard-review">
            <p className="article-editor__eyebrow">Τελικός έλεγχος</p><h2>{title || "Χωρίς τίτλο"}</h2>
            <dl><div><dt>Slug</dt><dd>/posts/{slug || "—"}</dd></div><div><dt>Απόσπασμα</dt><dd>{excerpt || "Δεν έχει συμπληρωθεί"}</dd></div>
              <div><dt>Κεντρική εικόνα</dt><dd>{featuredMediaId ? "Επιλέχθηκε" : "Δεν επιλέχθηκε"}</dd></div>
              <div><dt>SEO</dt><dd>{seoTitle && seoDescription ? "Συμπληρωμένο" : "Χρειάζεται έλεγχο"}</dd></div></dl>
            <p>Έλεγξε τις ρυθμίσεις και πάτησε «Αποθήκευση άρθρου». Η κατάσταση δημοσίευσης που επέλεξες στο προηγούμενο βήμα θα εφαρμοστεί από τον server.</p>
          </div> : null}
        </section>
        <aside className="article-editor__inspector" hidden={wizardStep !== 4}>
          <p className="article-editor__eyebrow">Ρυθμίσεις δημοσίευσης</p>
          <h2>Η ιστορία σου</h2>
          <div className="article-editor__selected-template"><span>TEMPLATE</span><strong>{articleTemplateCatalog[articleTemplate].label}</strong><small>{articleTemplateCatalog[articleTemplate].description}</small></div>
          <label htmlFor="article-status">Κατάσταση</label>
          <select id="article-status" name="status" value={status} onChange={(event) => setStatus(event.target.value as ArticleEditorValue["status"])}>
            <option value="draft">Πρόχειρο</option>
            <option value="review">Για έλεγχο</option>
            {canPublish ? <option value="scheduled">Προγραμματισμένο</option> : null}
            {canPublish ? <option value="published">Δημοσιευμένο</option> : null}
            {canPublish ? <option value="archived">Αρχειοθετημένο</option> : null}
          </select>
          {status === "scheduled" ? <><label htmlFor="article-scheduled-for">Ημερομηνία και ώρα δημοσίευσης</label><input id="article-scheduled-for" name="scheduledFor" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} required /><small>Ώρα Ελλάδας · Europe/Athens. Το άρθρο παραμένει ιδιωτικό μέχρι να εκτελεστεί ο ασφαλής publisher μετά την επιλεγμένη ώρα.</small></> : <input type="hidden" name="scheduledFor" value="" />}
          <label htmlFor="article-template">Template άρθρου</label>
          <select id="article-template" value={articleTemplate} onChange={(event) => setArticleTemplate(event.target.value as ArticleEditorValue["articleTemplate"])}>
            {!isActiveArticleTemplateKey(articleTemplate) ? <option value={articleTemplate} disabled>{articleTemplateCatalog[articleTemplate].label} · παλιό template</option> : null}
            {activeArticleTemplateKeys.map((key) => <option key={key} value={key}>{articleTemplateCatalog[key].label}</option>)}
          </select>
          <label htmlFor="header-template">Header override</label>
          <select id="header-template" name="headerTemplate" value={headerTemplate ?? ""} onChange={(event) => {
            const next = event.target.value;
            setHeaderTemplate(headerTemplateKeys.some((key) => key === next) ? next as HeaderTemplateValue : null);
          }}>
            <option value="">Από την κατηγορία</option>
            {headerTemplateKeys.map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
          <label htmlFor="article-category">Κατηγορία</label>
          <select id="article-category" name="categoryId" value={categoryId ?? ""} onChange={(event) => setCategoryId(event.target.value || null)}>
            <option value="">Χωρίς κατηγορία</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="article-editor__media"><strong>Κεντρική εικόνα</strong><small>Για τις κάρτες, το άρθρο και την κοινοποίηση.</small><MediaPicker label="Κεντρική εικόνα" value={featuredMediaId} selectedAsset={mediaAssets.find((asset) => asset.id === featuredMediaId)} onChange={(asset) => setFeaturedMediaId(asset?.id ?? null)} /></div>
          <div className="article-editor__media"><strong>Δευτερεύουσα εικόνα</strong><small>Εμφανίζεται μέσα στο άρθρο μετά το πρώτο block.</small><MediaPicker label="Δευτερεύουσα εικόνα" value={secondaryMediaId} selectedAsset={mediaAssets.find((asset) => asset.id === secondaryMediaId)} onChange={(asset) => setSecondaryMediaId(asset?.id ?? null)} /></div>
          <div className="article-editor__seo"><strong>SEO & κοινοποίηση</strong>
            <label htmlFor="article-seo-title">SEO τίτλος</label><input id="article-seo-title" name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={255} lang="el" spellCheck placeholder="Αν είναι κενό, χρησιμοποιείται ο τίτλος άρθρου" />
            <label htmlFor="article-seo-description">SEO περιγραφή</label><textarea id="article-seo-description" name="seoDescription" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={320} rows={4} lang="el" spellCheck placeholder="Αν είναι κενή, χρησιμοποιείται η σύντομη περιγραφή" />
            <div className="article-editor__seo-preview"><span>ΠΡΟΕΠΙΣΚΟΠΗΣΗ ΑΝΑΖΗΤΗΣΗΣ</span><strong>{seoTitle || title || "Τίτλος άρθρου"}</strong><small>acadimies.gr/posts/{slug || "slug"}</small><p>{seoDescription || excerpt || "Σύντομη περιγραφή του άρθρου."}</p></div>
          </div>
          <div className="article-editor__tags"><strong>Λέξεις-κλειδιά / tags</strong><small>Χρησιμοποιούνται για τη θεματική σύνδεση και τις σχετικές ιστορίες. Μέχρι 20 υπάρχοντα και 10 νέα tags.</small>
            <label htmlFor="article-tag-search">Αναζήτηση υπαρχόντων tags</label><input id="article-tag-search" type="search" value={tagSearch} onChange={(event) => setTagSearch(event.target.value)} placeholder="Αναζήτησε tag…" />
            <div className="article-editor__tag-options" role="group" aria-label="Υπάρχοντα tags">
              {visibleTags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} checked={selectedTagIds.includes(tag.id)} onChange={(event) => setSelectedTagIds((current) => event.target.checked ? [...new Set([...current, tag.id])].slice(0, 20) : current.filter((id) => id !== tag.id))} /><span>{tag.name}</span></label>)}
              {!visibleTags.length ? <small>Δεν βρέθηκαν tags.</small> : null}
            </div>
            <label htmlFor="article-new-tags">Νέα SEO keywords</label><textarea id="article-new-tags" name="newTags" value={newTags} onChange={(event) => setNewTags(event.target.value)} rows={3} maxLength={800} placeholder="Χώρισε τις λέξεις με κόμμα, ελληνικό ερωτηματικό ή νέα γραμμή." lang="el" spellCheck />
          </div>
          <div className="article-editor__proofing"><strong>Ελληνική ορθογραφία</strong><small>Ο browser ελέγχει ορθογραφία στα ελληνικά και ο editor εμφανίζει βασικές συντακτικές υποδείξεις. Δεν αλλάζουμε αυτόματα το κείμενο και δεν στέλνουμε άρθρα σε τρίτη υπηρεσία.</small></div>
          {mode === "edit" ? <div className="article-editor__revisions"><strong>Ιστορικό αποθηκεύσεων</strong><small>Η επαναφορά είναι αναστρέψιμη: πριν εφαρμοστεί, η τρέχουσα κατάσταση αποθηκεύεται ως νέο checkpoint.</small>
            {revisions.length ? <ol>{revisions.map((revision) => <li key={revision.revisionNumber}><div><span>#{revision.revisionNumber} · {revision.editorName ?? "Συντάκτης"}</span><small>{revision.changeSummary ?? "Ενημέρωση άρθρου"}</small><time dateTime={revision.createdAt}>{revision.createdAt.slice(0, 16).replace("T", " ")} UTC</time></div>{restoreAction ? <button type="submit" formAction={restoreAction.bind(null, revision.revisionNumber)} formNoValidate onClick={(event) => { if (!window.confirm(`Να επαναφερθεί η έκδοση #${revision.revisionNumber}; Η τρέχουσα κατάσταση θα διατηρηθεί ως checkpoint.`)) event.preventDefault(); }}>Επαναφορά</button> : null}</li>)}</ol> : <small>Δεν υπάρχουν ακόμη revisions.</small>}
          </div> : null}
        </aside>
      </div>
      <footer className="article-editor__wizard-navigation">
        <button type="button" onClick={() => setWizardStep((step) => Math.max(mode === "create" ? 2 : 1, step - 1))} disabled={wizardStep === (mode === "create" ? 2 : 1)}><ChevronLeft aria-hidden="true" />Προηγούμενο</button>
        <span>Βήμα {wizardStep} από 5</span>
        {wizardStep < 5 ? <button type="button" onClick={() => setWizardStep((step) => Math.min(5, step + 1))}>Επόμενο<ChevronRight aria-hidden="true" /></button> : null}
      </footer>
    </form>
  );
}
