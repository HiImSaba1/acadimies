import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { ShapedStoryCard } from "@/components/editorial/ShapedStoryCard";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { getTopicArchive } from "@/features/topic-pages/data";
import { parseTopicPage, TOPIC_PAGE_SIZE, topicCanonical } from "@/features/topic-pages/model";

export const revalidate = 300;
type TopicPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ params, searchParams }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = parseTopicPage((await searchParams).page);
  const archive = await getTopicArchive(slug, page);
  if (!archive) return {};
  const title = page > 1 ? `${archive.topic.name} — Σελίδα ${page}` : archive.topic.name;
  const description = `Άρθρα, νέα και αναλύσεις της Ακαδημίες για ${archive.topic.name}.`;
  return { title, description, alternates: { canonical: topicCanonical(slug, page) },
    openGraph: { type: "website", title: `${title} | Ακαδημίες`, description, url: topicCanonical(slug, page) } };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { slug } = await params;
  const page = parseTopicPage((await searchParams).page);
  const archive = await getTopicArchive(slug, page);
  if (!archive) notFound();
  const totalPages = Math.max(1, Math.ceil(archive.topic.total / TOPIC_PAGE_SIZE));
  if (page > totalPages) notFound();
  const href = (target: number) => topicCanonical(slug, target);
  return <PageEntrance><HeaderPreview onLight /><main id="main-content" className="topic-archive">
    <header className="site-shell topic-archive__header"><p className="eyebrow">Θεματικό αρχείο</p><h1>{archive.topic.name}</h1><p>{archive.topic.total} δημοσιευμένα άρθρα</p></header>
    <section className="site-shell topic-archive__feed" aria-label={`Άρθρα για ${archive.topic.name}`}>
      <div className="topic-archive__grid">{archive.stories.map((story) => <ShapedStoryCard key={story.slug} story={story} />)}</div>
      <nav className="topic-archive__pagination" aria-label="Σελιδοποίηση θεματικού αρχείου">
        {page > 1 ? <Link rel="prev" href={href(page - 1)}>Προηγούμενη</Link> : <span />}
        <span>Σελίδα {page} από {totalPages}</span>
        {page < totalPages ? <Link rel="next" href={href(page + 1)}>Επόμενη</Link> : <span />}
      </nav>
    </section>
  </main><PublicationFooter year={new Date().getUTCFullYear()} /></PageEntrance>;
}
