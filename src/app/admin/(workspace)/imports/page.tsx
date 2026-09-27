import Link from "next/link";
import { importStates } from "@/db/schema";
import { requireCapability } from "@/lib/auth/session";
import { getWordPressStagingOverview } from "@/features/wordpress-import/review-repository";
import type { ImportState } from "@/features/wordpress-import/stage";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";

const sourceTypes = ["post", "page", "attachment", "nav_menu_item", "custom_css", "wp_global_styles"];

function reviewUrl(page: number, state?: string, sourceType?: string) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  if (state) query.set("state", state);
  if (sourceType) query.set("type", sourceType);
  return `/admin/imports?${query.toString()}`;
}

export default async function AdminImportsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; state?: string; type?: string }>;
}) {
  await requireCapability("migration:review");
  const query = await searchParams;
  const requestedPage = Number(query.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1000 ? requestedPage : 1;
  const state = importStates.includes(query.state as ImportState) ? query.state as ImportState : undefined;
  const sourceType = sourceTypes.includes(query.type ?? "") ? query.type : undefined;
  const { batches, records, total, pageSize, stateCounts } = await getWordPressStagingOverview({ page, state, sourceType });
  const hasNext = page * pageSize < total;

  return <main className="admin-list admin-imports">
    <header><div><p>Ασφαλής μεταφορά περιεχομένου</p><AnimatedHeadline as="h1">WordPress staging</AnimatedHeadline></div></header>
    <p>Οι αποφάσεις εδώ αφορούν μόνο το staging. Δεν δημοσιεύουν άρθρα και δεν μεταφέρουν αρχεία εικόνων.</p>
    {batches.length ? <section aria-labelledby="migration-health-title">
      <h2 id="migration-health-title">Υγεία ιστορικού αρχείου</h2>
      <div className="admin-imports__health">
        {importStates.map((value) => <div key={value}><strong>{stateCounts[value] ?? 0}</strong><span>{value}</span></div>)}
      </div>
      <p className="admin-imports__count">Οι αριθμοί προέρχονται από την τελευταία παρτίδα staging. Η αναφορά δεν αλλάζει κατάσταση ούτε δημοσιεύει περιεχόμενο.</p>
    </section> : null}
    <section>
      <h2>Παρτίδες εισαγωγής</h2>
      {batches.length ? <div className="admin-table" role="table" aria-label="Παρτίδες WordPress">
        {batches.map((batch) => <article role="row" key={batch.id}>
          <div role="cell"><strong>{batch.sourceFile}</strong><span>SHA-256: {batch.sourceSha256.slice(0, 12)}…</span></div>
          <span role="cell">{batch.state}</span>
          <span role="cell">{batch.totals.items ?? 0} αντικείμενα · {batch.totals.quarantined ?? 0} σε καραντίνα</span>
          <span role="cell">{batch.createdAt.toLocaleDateString("el-GR")}</span>
        </article>)}
      </div> : <p className="admin-empty">Δεν έχει γίνει staging. Το περασμένο dry-run δεν αποθήκευσε εγγραφές στη βάση.</p>}
    </section>
    {batches.length ? <section>
      <h2>Εγγραφές για εκδοτικό έλεγχο</h2>
      <form className="admin-imports__filters" action="/admin/imports" method="get">
        <label>Κατάσταση<select name="state" defaultValue={state ?? ""}><option value="">Όλες</option>{importStates.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label>Τύπος<select name="type" defaultValue={sourceType ?? ""}><option value="">Όλοι</option>{sourceTypes.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <button type="submit">Εφαρμογή φίλτρων</button>
      </form>
      <p className="admin-imports__count">{total} εγγραφές · Σελίδα {page}</p>
      {records.length ? <div className="admin-table" role="table" aria-label="Εγγραφές WordPress">
        {records.map((record) => <article role="row" key={record.id}>
          <div role="cell"><strong>{record.title || `WordPress #${record.externalId}`}</strong><span>{record.sourceType} · #{record.externalId}</span></div>
          <span role="cell">{record.state}</span>
          <span role="cell">{record.riskFlags.join(", ") || "—"}</span>
          <Link role="cell" href={`/admin/imports/${record.id}`}>Έλεγχος</Link>
        </article>)}
      </div> : <p className="admin-empty">Δεν υπάρχουν εγγραφές για αυτά τα φίλτρα.</p>}
      <nav className="admin-imports__pagination" aria-label="Σελίδες εισαγωγής">
        {page > 1 ? <Link href={reviewUrl(page - 1, state, sourceType)}>Προηγούμενη</Link> : <span>Προηγούμενη</span>}
        {hasNext ? <Link href={reviewUrl(page + 1, state, sourceType)}>Επόμενη</Link> : <span>Επόμενη</span>}
      </nav>
    </section> : null}
  </main>;
}
