"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticleDocument } from "@/features/articles/document";
import { EditorialRichText } from "@/components/articles/EditorialRichText";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ProofreadingHints } from "@/components/admin/ProofreadingHints";
import type { MediaAssetOption } from "@/features/admin-articles/media-contracts";
import { parseRecoverableDraft, type DraftSnapshot } from "@/features/admin-articles/draft-recovery";
import {
  insertArticleBlock, moveArticleBlock, removeArticleBlock, replaceArticleBlock,
  type ArticleBlock, type ArticleBlockType,
} from "@/features/admin-articles/block-editor-model";

type Props = { initialDocument: ArticleDocument; draftKey: string; clearDraftKey?: string; initialMediaAssets?: MediaAssetOption[] };
type ControlledProps = Props & { document: ArticleDocument; onDocumentChange: (document: ArticleDocument) => void };

const addableBlocks: { type: ArticleBlockType; label: string }[] = [
  { type: "paragraph", label: "+ Παράγραφος" },
  { type: "heading", label: "+ Υπότιτλος" },
  { type: "quote", label: "+ Παράθεμα" },
  { type: "question", label: "+ Ερώτηση / απάντηση" },
  { type: "cta", label: "+ Κουμπί CTA" },
  { type: "image", label: "+ Εικόνα" },
  { type: "chapter", label: "+ Κεφάλαιο εικόνα / κείμενο" },
];

const blockLabels: Record<ArticleBlockType, string> = {
  paragraph: "Παράγραφος", heading: "Υπότιτλος", quote: "Παράθεμα",
  question: "Ερώτηση / απάντηση", cta: "Κουμπί CTA", score: "Σκορ", image: "Εικόνα", chapter: "Κεφάλαιο",
};

export function ArticleBlockEditor({ initialDocument, document, onDocumentChange, draftKey, clearDraftKey, initialMediaAssets = [] }: ControlledProps) {
  const [recovery, setRecovery] = useState<DraftSnapshot | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Το πρόχειρο αποθηκεύεται μόνο σε αυτόν τον browser.");
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const storageKey = `acadimies-editor-draft:${draftKey}`;

  function setDocument(next: ArticleDocument | ((current: ArticleDocument) => ArticleDocument)) {
    onDocumentChange(typeof next === "function" ? next(document) : next);
  }

  useEffect(() => {
    if (!clearDraftKey) return;
    try { window.localStorage.removeItem(`acadimies-editor-draft:${clearDraftKey}`); } catch { /* Browser storage may be unavailable. */ }
  }, [clearDraftKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const candidate = parseRecoverableDraft(window.localStorage.getItem(storageKey), initialDocument);
        if (candidate) {
          setRecovery(candidate);
          return;
        }
      } catch {
        // A corrupt or unavailable local draft never blocks database editing.
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDocument, storageKey]);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ savedAt: new Date().toISOString(), document } satisfies DraftSnapshot));
        setDraftStatus("Το τοπικό πρόχειρο ενημερώθηκε. Πάτησε «Αποθήκευση άρθρου» για τη βάση.");
      } catch {
        setDraftStatus("Δεν είναι διαθέσιμη η τοπική ανάκτηση. Αποθήκευσε το άρθρο στη βάση.");
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [document, draftReady, storageKey]);

  function updateBlock(index: number, block: ArticleBlock) {
    setDocument((current) => ({ ...current, blocks: replaceArticleBlock(current.blocks, index, block) }));
  }

  function formatText(index: number, marker: "**" | "*" | "link") {
    const current = document.blocks[index];
    const textarea = textareaRefs.current[index];
    if (!textarea || !current || !("text" in current)) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = current.text.slice(start, end) || "κείμενο";
    const replacement = marker === "link" ? `[${selected}](https://example.com)` : `${marker}${selected}${marker}`;
    updateBlock(index, { ...current, text: current.text.slice(0, start) + replacement + current.text.slice(end) });
    window.requestAnimationFrame(() => textarea.focus());
  }

  function textBlock(index: number, block: Extract<ArticleBlock, { type: "paragraph" | "heading" | "quote" }>) {
    return <>
      <div className="article-block-editor__toolbar" role="group" aria-label={`Μορφοποίηση block ${index + 1}`}>
        <button type="button" onClick={() => formatText(index, "**")} aria-label="Έντονη γραφή">B</button>
        <button type="button" onClick={() => formatText(index, "*")} aria-label="Πλάγια γραφή"><em>I</em></button>
        <button type="button" onClick={() => formatText(index, "link")} aria-label="Προσθήκη συνδέσμου">↗ Link</button>
      </div>
      <label htmlFor={`article-block-${index}`}>Κείμενο</label>
      <textarea id={`article-block-${index}`} ref={(node) => { textareaRefs.current[index] = node; }} value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} rows={block.type === "heading" ? 2 : 6} lang="el" spellCheck placeholder="Γράψε εδώ. Επίλεξε κείμενο για μορφοποίηση." />
      <ProofreadingHints text={block.text} />
      {block.type === "quote" ? <><label htmlFor={`article-block-attribution-${index}`}>Πηγή / πρόσωπο</label><input id={`article-block-attribution-${index}`} value={block.attribution ?? ""} onChange={(event) => updateBlock(index, { ...block, attribution: event.target.value })} lang="el" spellCheck /></> : null}
      {block.text ? <div className="article-block-editor__preview" aria-label="Προεπισκόπηση μορφοποίησης"><EditorialRichText text={block.text} /></div> : null}
    </>;
  }

  return <div className="article-block-editor">
    <input id="article-document" type="hidden" name="contentDocument" value={JSON.stringify(document)} />
    {recovery ? <div className="article-block-editor__recovery" role="status">
      <strong>Βρέθηκε μη αποθηκευμένο τοπικό πρόχειρο.</strong>
      <span>Δεν έχει αντικαταστήσει το άρθρο της βάσης.</span>
      <div><button type="button" onClick={() => { setDocument(recovery.document); setRecovery(null); setDraftReady(true); }}>Επαναφορά πρόχειρου</button>
      <button type="button" onClick={() => { setRecovery(null); setDraftReady(true); }}>Κράτησε την έκδοση της βάσης</button></div>
    </div> : null}
    <label htmlFor="article-dek">Υπότιτλος / εισαγωγή άρθρου</label>
    <textarea id="article-dek" value={document.dek} onChange={(event) => setDocument((current) => ({ ...current, dek: event.target.value }))} maxLength={600} rows={3} lang="el" spellCheck placeholder="Μικρή εισαγωγή μέσα στη σελίδα του άρθρου." />
    <ProofreadingHints text={document.dek} />
    <div className="article-block-editor__add" role="group" aria-label="Προσθήκη block">
      {addableBlocks.map(({ type, label }) => <button type="button" key={type} onClick={() => setDocument((current) => ({ ...current, blocks: insertArticleBlock(current.blocks, type) }))}>{label}</button>)}
    </div>
    <div className="article-block-editor__blocks">
      {document.blocks.map((block, index) => <section key={`${index}-${block.type}`} className="article-block-editor__block" aria-label={`${blockLabels[block.type]} ${index + 1}`}>
        <header><span>0{index + 1} / {blockLabels[block.type]}</span><div role="group" aria-label={`Μετακίνηση block ${index + 1}`}>
          <button type="button" aria-label={`Μετακίνηση block ${index + 1} πάνω`} disabled={index === 0} onClick={() => setDocument((current) => ({ ...current, blocks: moveArticleBlock(current.blocks, index, -1) }))}>↑</button>
          <button type="button" aria-label={`Μετακίνηση block ${index + 1} κάτω`} disabled={index === document.blocks.length - 1} onClick={() => setDocument((current) => ({ ...current, blocks: moveArticleBlock(current.blocks, index, 1) }))}>↓</button>
          <button type="button" aria-label={`Αφαίρεση block ${index + 1}`} disabled={document.blocks.length === 1} onClick={() => setDocument((current) => ({ ...current, blocks: removeArticleBlock(current.blocks, index) }))}>×</button>
        </div></header>
        {block.type === "paragraph" || block.type === "heading" || block.type === "quote" ? textBlock(index, block) : null}
        {block.type === "question" ? <><label htmlFor={`article-question-${index}`}>Ερώτηση</label><input id={`article-question-${index}`} value={block.question} onChange={(event) => updateBlock(index, { ...block, question: event.target.value })} lang="el" spellCheck /><ProofreadingHints text={block.question} /><label htmlFor={`article-answer-${index}`}>Απάντηση</label><textarea id={`article-answer-${index}`} value={block.answer} onChange={(event) => updateBlock(index, { ...block, answer: event.target.value })} rows={5} lang="el" spellCheck /><ProofreadingHints text={block.answer} /></> : null}
        {block.type === "cta" ? <><label htmlFor={`article-cta-label-${index}`}>Κείμενο κουμπιού</label><input id={`article-cta-label-${index}`} value={block.label} onChange={(event) => updateBlock(index, { ...block, label: event.target.value })} maxLength={120} lang="el" spellCheck /><label htmlFor={`article-cta-href-${index}`}>URL προορισμού</label><input id={`article-cta-href-${index}`} value={block.href} onChange={(event) => updateBlock(index, { ...block, href: event.target.value })} placeholder="/contact ή https://…" inputMode="url" /></> : null}
        {block.type === "score" ? <div className="article-block-editor__score">{(["home", "away", "homeScore", "awayScore", "minute"] as const).map((field) => <label key={field}>{field}<input type={field === "homeScore" || field === "awayScore" ? "number" : "text"} value={block[field]} onChange={(event) => updateBlock(index, { ...block, [field]: field === "homeScore" || field === "awayScore" ? Number(event.target.value) : event.target.value })} /></label>)}</div> : null}
        {block.type === "image" ? <><MediaPicker label="Εικόνα περιεχομένου" value={block.mediaId || null} selectedAsset={initialMediaAssets.find((asset) => asset.id === block.mediaId)} onChange={(asset) => updateBlock(index, { ...block, mediaId: asset?.id ?? "", alt: block.alt || asset?.alt || "" })} /><label htmlFor={`article-alt-${index}`}>Εναλλακτικό κείμενο (υποχρεωτικό)</label><input id={`article-alt-${index}`} value={block.alt} onChange={(event) => updateBlock(index, { ...block, alt: event.target.value })} lang="el" spellCheck /><label htmlFor={`article-caption-${index}`}>Λεζάντα</label><input id={`article-caption-${index}`} value={block.caption ?? ""} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })} lang="el" spellCheck /></> : null}
        {block.type === "chapter" ? <><label htmlFor={`article-chapter-heading-${index}`}>Τίτλος κεφαλαίου</label><input id={`article-chapter-heading-${index}`} value={block.heading} onChange={(event) => updateBlock(index, { ...block, heading: event.target.value })} lang="el" spellCheck /><label htmlFor={`article-chapter-text-${index}`}>Κείμενο κεφαλαίου</label><textarea id={`article-chapter-text-${index}`} value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} rows={7} lang="el" spellCheck /><ProofreadingHints text={`${block.heading} ${block.text}`} /><MediaPicker label="Εικόνα κεφαλαίου" value={block.mediaId || null} selectedAsset={initialMediaAssets.find((asset) => asset.id === block.mediaId)} onChange={(asset) => updateBlock(index, { ...block, mediaId: asset?.id ?? "", alt: block.alt || asset?.alt || "" })} /><label htmlFor={`article-chapter-alt-${index}`}>Εναλλακτικό κείμενο (υποχρεωτικό)</label><input id={`article-chapter-alt-${index}`} value={block.alt} onChange={(event) => updateBlock(index, { ...block, alt: event.target.value })} lang="el" spellCheck /><label htmlFor={`article-chapter-side-${index}`}>Θέση εικόνας</label><select id={`article-chapter-side-${index}`} value={block.imageSide} onChange={(event) => updateBlock(index, { ...block, imageSide: event.target.value as "left" | "right" })}><option value="left">Αριστερά</option><option value="right">Δεξιά</option></select></> : null}
        <div className="article-block-editor__insert"><button type="button" onClick={() => setDocument((current) => ({ ...current, blocks: insertArticleBlock(current.blocks, "paragraph", index) }))}>+ Block μετά από αυτό</button></div>
      </section>)}
    </div>
    <p className="article-block-editor__status" role="status">{draftStatus}</p>
  </div>;
}
