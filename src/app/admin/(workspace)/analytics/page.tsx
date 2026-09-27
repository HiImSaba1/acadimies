import Link from "next/link";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { getReadershipOverview } from "@/features/analytics/repository";
import { requireStaffSession } from "@/lib/auth/session";

export default async function AdminAnalyticsPage() {
  await requireStaffSession();
  const overview = await getReadershipOverview();
  return <main className="admin-list admin-analytics">
    <header><div><p>Ανώνυμη συγκεντρωτική μέτρηση</p><AnimatedHeadline as="h1">Αναγνωσιμότητα</AnimatedHeadline></div></header>
    <p>Δεν αποθηκεύονται IP, cookies, user-agent ή προσωπικά στοιχεία. Κάθε μέτρηση αφορά μόνο άρθρο, ημερομηνία και συνολικό αριθμό προβολών.</p>
    <section className="admin-analytics__summary" aria-label="Σύνοψη προβολών">
      <div><strong>{overview.today}</strong><span>Σήμερα</span></div>
      <div><strong>{overview.lastThirtyDays}</strong><span>Τελευταίες 30 ημέρες</span></div>
    </section>
    <section><h2>Δημοφιλέστερα άρθρα 30 ημερών</h2>
      {overview.topPosts.length ? <ol className="admin-analytics__list">{overview.topPosts.map((post) =>
        <li key={post.slug}><Link href={`/posts/${post.slug}`}>{post.title}</Link><strong>{post.views}</strong></li>)}</ol>
        : <p className="admin-empty">Δεν υπάρχουν ακόμη καταγεγραμμένες προβολές.</p>}
    </section>
  </main>;
}
