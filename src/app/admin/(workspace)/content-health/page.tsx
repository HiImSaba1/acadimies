import Link from "next/link";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { contentHealthIssueKeys, contentHealthIssueLabels } from "@/features/content-health/model";
import { getContentHealthOverview } from "@/features/content-health/repository";
import { requireStaffSession } from "@/lib/auth/session";

export default async function AdminContentHealthPage() {
  await requireStaffSession();
  const overview = await getContentHealthOverview();

  return <main className="admin-list admin-content-health">
    <header><div><p>Έλεγχος δημοσιευμένου αρχείου</p><AnimatedHeadline as="h1">Υγεία περιεχομένου</AnimatedHeadline></div></header>
    <p className="admin-content-health__intro">Η λίστα είναι μόνο για έλεγχο. Δεν αλλάζει, δεν αποσύρει και δεν δημοσιεύει άρθρα. Εμφανίζει αποκλειστικά ήδη δημοσιευμένο περιεχόμενο.</p>
    <section className="admin-content-health__summary" aria-label="Σύνοψη υγείας περιεχομένου">
      <div><strong>{overview.published}</strong><span>Δημοσιευμένα</span></div>
      <div><strong>{overview.healthy}</strong><span>Χωρίς εκκρεμότητες</span></div>
      {contentHealthIssueKeys.map((key) => <div key={key}><strong>{overview.totals[key]}</strong><span>{contentHealthIssueLabels[key]}</span></div>)}
    </section>
    <section aria-labelledby="content-health-issues">
      <h2 id="content-health-issues">Άρθρα που χρειάζονται έλεγχο</h2>
      {overview.articles.length ? <ol className="admin-content-health__list">{overview.articles.map((article) =>
        <li key={article.id}>
          <div><Link href={`/admin/articles/${article.id}/edit`}>{article.title}</Link>
            <ul aria-label={`Εκκρεμότητες για ${article.title}`}>{article.issues.map((issue) =>
              <li key={issue}>{contentHealthIssueLabels[issue]}</li>)}</ul>
          </div>
          <Link href={`/posts/${article.slug}`}>Προβολή</Link>
        </li>)}</ol> : <p className="admin-empty">Όλα τα δημοσιευμένα άρθρα έχουν τα βασικά στοιχεία.</p>}
      {overview.truncated ? <p className="admin-content-health__notice">Εμφανίζονται οι 100 πιο πρόσφατες εκκρεμότητες.</p> : null}
    </section>
  </main>;
}
