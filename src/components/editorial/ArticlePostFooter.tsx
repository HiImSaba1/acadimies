import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleRelatedCarousel, type RelatedStoryLink } from "./ArticleRelatedCarousel";

type StoryLink = RelatedStoryLink;

export function ArticlePostFooter({ previous, next, related }: { previous: StoryLink | null; next: StoryLink | null; related: StoryLink[] }) {
  return <aside className="article-post-footer" aria-label="Συνέχεια ανάγνωσης">
    <nav className="article-post-navigation" aria-label="Προηγούμενο και επόμενο άρθρο">
      {previous ? <Link href={`/posts/${previous.slug}`}><small>Προηγούμενο άρθρο</small><span><ArrowLeft aria-hidden="true" /><span className="article-post-navigation__title"><span>{previous.title}</span><span aria-hidden="true">{previous.title}</span></span></span></Link> : <span />}
      {next ? <Link href={`/posts/${next.slug}`}><small>Επόμενο άρθρο</small><span><span className="article-post-navigation__title"><span>{next.title}</span><span aria-hidden="true">{next.title}</span></span><ArrowRight aria-hidden="true" /></span></Link> : <span />}
    </nav>
    {related.length ? <section className="article-related" aria-labelledby="related-posts-title">
      <ArticleRelatedCarousel stories={related} label="Από το ίδιο αρχείο" title="Σχετικές ιστορίες" titleId="related-posts-title" />
    </section> : null}
  </aside>;
}
