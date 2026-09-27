import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { WordPressReviewControls } from "@/components/admin/WordPressReviewControls";
import { getWordPressReviewRecord } from "@/features/wordpress-import/review-repository";
import { requireCapability } from "@/lib/auth/session";

export default async function AdminImportRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("migration:review");
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const record = await getWordPressReviewRecord(id);
  if (!record) notFound();

  const categoryNames = record.categories.map((category) =>
    category && typeof category === "object" && "name" in category ? String(category.name) : "",
  ).filter(Boolean);

  return <main className="admin-list admin-import-detail">
    <header><div><p><Link href="/admin/imports">← Όλες οι εγγραφές</Link></p><AnimatedHeadline as="h1">{record.title || `WordPress #${record.externalId}`}</AnimatedHeadline></div></header>
    <div className="admin-import-detail__grid">
      <section><h2>Ασφαλής προεπισκόπηση</h2>
        <p className="admin-import-detail__preview">{record.previewText || "Δεν υπάρχει αποθηκευμένο κείμενο."}</p>
        <p>Το preview αποδίδεται ως απλό κείμενο. Δεν εκτελεί HTML και δεν φορτώνει απομακρυσμένες εικόνες.</p>
      </section>
      <aside>
        <dl>
          <dt>WordPress ID</dt><dd>{record.externalId}</dd>
          <dt>Τύπος / αρχική κατάσταση</dt><dd>{record.sourceType} / {record.originalStatus}</dd>
          <dt>Staging κατάσταση</dt><dd>{record.state}</dd>
          <dt>Συντάκτης</dt><dd>{record.creatorLogin || "—"}</dd>
          <dt>Κατηγορίες</dt><dd>{categoryNames.join(", ") || "—"}</dd>
          <dt>Πηγή</dt><dd>{record.sourceUrl || "—"}</dd>
          <dt>Attachment URL</dt><dd>{record.attachmentUrl || "—"}</dd>
          <dt>Σημαίες κινδύνου</dt><dd>{record.riskFlags.join(", ") || "Καμία"}</dd>
        </dl>
        <WordPressReviewControls record={record} />
      </aside>
    </div>
  </main>;
}
