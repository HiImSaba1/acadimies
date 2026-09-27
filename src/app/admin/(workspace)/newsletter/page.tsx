import { requireCapability } from "@/lib/auth/session";
import { listNewsletterOverview } from "@/features/newsletter/repository";
import { NewsletterCampaignForm } from "@/components/admin/NewsletterCampaignForm";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";

const subscriberStatus = { pending: "Αναμονή επιβεβαίωσης", confirmed: "Επιβεβαιωμένος", unsubscribed: "Διαγραμμένος" };
const campaignStatus = { draft: "Πρόχειρο", ready: "Έτοιμο", scheduled: "Προγραμματισμένο", sending: "Αποστολή", sent: "Στάλθηκε", cancelled: "Ακυρωμένο" };

export default async function AdminNewsletterPage() {
  await requireCapability("newsletter:manage");
  const { subscribers, campaigns, counts } = await listNewsletterOverview();
  return <main className="admin-list admin-newsletter">
    <header><div><p>Συναίνεση & επικοινωνία</p><AnimatedHeadline as="h1">Newsletter</AnimatedHeadline></div><div className="admin-newsletter__counts">{counts.map(({ status, total }) => <span key={status}>{subscriberStatus[status]} <strong>{total}</strong></span>)}</div></header>
    <NewsletterCampaignForm />
    <section><h2>Πρόχειρες καμπάνιες</h2>{campaigns.length ? <div className="admin-table" role="table" aria-label="Καμπάνιες newsletter">{campaigns.map((campaign) => <article role="row" key={campaign.id}><div role="cell"><strong>{campaign.title}</strong><span>{campaign.subject}</span></div><span role="cell">{campaignStatus[campaign.status]}</span><span role="cell">Καμία αποστολή</span></article>)}</div> : <p className="admin-empty">Δεν υπάρχουν ακόμη καμπάνιες.</p>}</section>
    <section><h2>Συνδρομητές</h2>{subscribers.length ? <div className="admin-table" role="table" aria-label="Συνδρομητές newsletter">{subscribers.map((subscriber) => <article role="row" key={subscriber.id}><div role="cell"><strong>{subscriber.email}</strong><span>{subscriber.consentedAt.toLocaleDateString("el-GR")}</span></div><span role="cell">{subscriberStatus[subscriber.status]}</span><span role="cell">{subscriber.confirmedAt ? "Double opt-in" : "Δεν επιβεβαιώθηκε"}</span></article>)}</div> : <p className="admin-empty">Δεν υπάρχουν ακόμη συνδρομητές.</p>}</section>
  </main>;
}
