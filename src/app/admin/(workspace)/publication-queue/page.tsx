import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { PublicationQueueActions } from "@/components/admin/PublicationQueueActions";
import { getPublicationQueueOverview } from "@/features/admin-articles/publication-queue";
import { requireCapability } from "@/lib/auth/session";

const stateLabels = { upcoming: "Προσεχώς", due: "Έτοιμο για δημοσίευση", failed: "Χρειάζεται έλεγχο" };
const dateFormatter = new Intl.DateTimeFormat("el-GR", { timeZone: "Europe/Athens", dateStyle: "medium", timeStyle: "short" });

export default async function PublicationQueuePage({ searchParams }: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  await requireCapability("article:publish");
  const [overview, query] = await Promise.all([getPublicationQueueOverview(), searchParams]);
  const due = overview.articles.filter((article) => article.state === "due").length;
  const failed = overview.articles.filter((article) => article.state === "failed").length;
  return <main className="admin-list admin-publication-queue">
    <header><div><p>Automation</p><AnimatedHeadline as="h1">Προγραμματισμένα άρθρα</AnimatedHeadline></div>
      <div className="admin-publication-queue__totals"><span><strong>{overview.articles.length}</strong> στην ουρά</span><span><strong>{due}</strong> έτοιμα</span><span><strong>{failed}</strong> έλεγχος</span></div></header>
    {query.cancelled ? <p className="admin-article-year__notice" role="status">{query.cancelled === "1" ? "Ο προγραμματισμός ακυρώθηκε και το άρθρο επέστρεψε στα πρόχειρα." : "Το άρθρο δεν ήταν πλέον προγραμματισμένο."}</p> : null}
    <section aria-labelledby="publication-queue-list"><h2 id="publication-queue-list">Automation</h2>
      {overview.articles.length ? <ol className="admin-publication-queue__list">{overview.articles.map((article) =>
        <li key={article.id} data-state={article.state}><div><span>{stateLabels[article.state]}</span><h3>{article.title}</h3>
          <p>{article.authorName ?? "Χωρίς συντάκτη"} · <time dateTime={article.scheduledFor?.toISOString()}>{article.scheduledFor ? dateFormatter.format(article.scheduledFor) : "Χωρίς ώρα"}</time></p></div>
          <PublicationQueueActions articleId={article.id} /></li>)}</ol> : <p className="admin-empty">Δεν υπάρχουν προγραμματισμένα άρθρα.</p>}
    </section>
    <section aria-labelledby="publication-run-history"><h2 id="publication-run-history">Τελευταίες εκτελέσεις</h2>
      {overview.runs.length ? <ol className="admin-publication-runs">{overview.runs.map((run) => <li key={run.createdAt.toISOString()}>
        <time dateTime={run.createdAt.toISOString()}>{dateFormatter.format(run.createdAt)}</time><span>Έλεγχος <strong>{run.checked}</strong></span><span>Δημοσιεύτηκαν <strong>{run.published}</strong></span><span>Αποτυχίες <strong>{run.failed}</strong></span>
      </li>)}</ol> : <p className="admin-empty">Ο scheduler δεν έχει εκτελεστεί ακόμη.</p>}
    </section>
  </main>;
}
