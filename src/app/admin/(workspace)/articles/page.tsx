import Link from "next/link";
import { requireCapability } from "@/lib/auth/session";
import { listAdminArticleYears } from "@/features/admin-articles/repository";

export default async function AdminArticlesPage() {
  await requireCapability("admin:access");
  const years = await listAdminArticleYears();
  return (
    <main className="admin-list admin-article-archive" data-admin-article-years>
      <header><div><p>Αρχείο περιεχομένου</p><h1>Άρθρα ανά έτος</h1></div><Link href="/admin/articles/new">Νέο άρθρο</Link></header>
      {years.length ? (
        <nav className="admin-article-years" aria-label="Αρχείο άρθρων ανά έτος">
          {years.map(({ year, total }) => <Link href={`/admin/articles/${year}`} key={year}>
            <span>{year}</span><small>{total} {total === 1 ? "άρθρο" : "άρθρα"}</small><b aria-hidden="true">↗</b>
          </Link>)}
        </nav>
      ) : <p className="admin-empty">Δεν υπάρχουν ακόμη άρθρα στη βάση.</p>}
    </main>
  );
}
