import type { ComponentType, ReactNode } from "react";
import type { ArticleTemplateKey } from "@/features/publication/contracts";
import type { ArticleDocument } from "@/features/articles/document";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { AnimatedLines } from "@/components/motion/AnimatedLines";
import { EditorialRichText } from "@/components/articles/EditorialRichText";
import Image from "next/image";
import Link from "next/link";
import { ArticleTextReveal } from "@/components/articles/ArticleTextReveal";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { ArticleImageGallery } from "@/components/articles/ArticleImageGallery";

export type ArticleMediaView = { id: string; url: string; alt: string; width: number | null; height: number | null };
export type RelatedArticleView = { slug: string; title: string; excerpt: string | null; author?: string | null; publishedLabel?: string | null; image?: ArticleMediaView };
export type ArticleViewProps = { title: string; category: string; author: string; authorHref?: string | null; topics?: Array<{ name: string; slug: string }>; document: ArticleDocument; featuredImage?: ArticleMediaView; secondaryImage?: ArticleMediaView; media?: ArticleMediaView[]; relatedStories?: RelatedArticleView[] };

function MediaFigure({ image, alt, variant }: { image: ArticleMediaView; alt: string; variant: "cover" | "secondary" | "block" }) {
  const cover = variant === "cover";
  return <figure className={`article-image article-image--${variant}`}><ClipReveal className="article-image__reveal"><ParallaxMedia className="article-image__parallax"><Image src={image.url} alt={alt} width={image.width || 1400} height={image.height || 900} unoptimized loading={cover ? "eager" : "lazy"} fetchPriority={cover ? "high" : undefined} sizes={cover ? "100vw" : "(max-width: 700px) 100vw, 75vw"} /></ParallaxMedia></ClipReveal></figure>;
}

type ImageBlock = Extract<ArticleDocument["blocks"][number], { type: "image" }>;

function ArticleBodyImage({ block, media, gallery = false }: { block: ImageBlock; media: ArticleMediaView[]; gallery?: boolean }) {
  const image = media.find((item) => item.id === block.mediaId);
  const className = gallery ? "article-image article-image--gallery" : "article-image article-image--block";
  return image
    ? <figure className={className}><ClipReveal className="article-image__reveal"><ParallaxMedia className="article-image__parallax"><Image src={image.url} alt={block.alt} width={image.width || 1400} height={image.height || 900} unoptimized sizes={gallery ? "(min-width: 900px) 33vw, 50vw" : "(max-width: 700px) 100vw, 75vw"} /></ParallaxMedia></ClipReveal>{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>
    : <figure className={className} role="img" aria-label={block.alt}><span>{block.mediaId}</span>{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
}

function Blocks({ document, media = [], secondaryImage }: Pick<ArticleViewProps, "document" | "media" | "secondaryImage">) {
  const bodyImages = document.blocks.filter((block): block is ImageBlock => block.type === "image");
  const firstBodyImage = bodyImages[0];
  const galleryImages = bodyImages.slice(1);

  return <div className="article-blocks">{document.blocks.map((block, index) => {
  if (block.type === "image" && block !== firstBodyImage) return null;
  const secondary = index === 0 && secondaryImage ? <MediaFigure image={secondaryImage} alt={secondaryImage.alt || "Δευτερεύουσα εικόνα άρθρου"} variant="secondary" /> : null;
  let content: ReactNode;
  if (block.type === "heading") content = <h2><EditorialRichText text={block.text} /></h2>;
  else if (block.type === "quote") content = <blockquote><span className="article-blockquote__text"><EditorialRichText text={block.text} /></span><cite>{block.attribution}</cite></blockquote>;
  else if (block.type === "score") content = <div className="score-block"><span>{block.home}</span><strong>{block.homeScore}–{block.awayScore}</strong><span>{block.away}</span><small>{block.minute}</small></div>;
  else if (block.type === "question") {
    const questionNumber = document.blocks.slice(0, index + 1).filter((item) => item.type === "question").length;
    content = <section className="qa-block" data-tone={questionNumber % 2 === 1 ? "dark" : "light"}><h2><EditorialRichText text={block.question} /></h2><p><EditorialRichText text={block.answer} /></p></section>;
  }
  else if (block.type === "cta") {
    const relative = block.href.startsWith("/") && !block.href.startsWith("//");
    let safeHref = relative ? block.href : "/contact";
    if (!relative) {
      try { const url = new URL(block.href); if (url.protocol === "https:") safeHref = url.toString(); } catch { /* Invalid editor URLs fall back to contact. */ }
    }
    content = <div className="article-cta"><EditorialButton href={safeHref} label={block.label} arrow="right" /></div>;
  }
  else if (block.type === "chapter") {
    const image = media.find((item) => item.id === block.mediaId);
    content = <section className="article-chapter" data-image-side={block.imageSide}>
      {image ? <MediaFigure image={image} alt={block.alt} variant="block" /> : <figure className="article-image" role="img" aria-label={block.alt}><span>{block.mediaId}</span></figure>}
      <div className="article-chapter__copy" data-article-reveal><h2><EditorialRichText text={block.heading} /></h2><p><EditorialRichText text={block.text} /></p></div>
    </section>;
  }
  else if (block.type === "image") content = <ArticleBodyImage block={block} media={media} />;
  else content = <p><EditorialRichText text={block.text} /></p>;
  return <div key={index} className="article-blocks__item" data-article-reveal={block.type === "image" || block.type === "chapter" ? undefined : ""}>{content}{secondary}</div>;
})}{galleryImages.length ? <ArticleImageGallery images={galleryImages.flatMap((block) => {
  const image = media.find((item) => item.id === block.mediaId);
  return image ? [{ id: image.id, src: image.url, alt: block.alt, ...(block.caption ? { caption: block.caption } : {}), width: image.width || 1400, height: image.height || 900 }] : [];
})} /> : null}</div>;
}

function Shell({ title, category, author, authorHref, topics = [], document, mode, featuredImage, secondaryImage, media, relatedStories = [] }: ArticleViewProps & { mode: ArticleTemplateKey }) {
  const body = <ArticleTextReveal><Blocks document={document} secondaryImage={secondaryImage} media={media} /></ArticleTextReveal>;
  return <article className={`article-template article-template--${mode}`} data-article-template={mode}>
    <header><AnimatedLines>{category}</AnimatedLines><AnimatedHeadline as="h1">{title}</AnimatedHeadline><AnimatedLines className="article-dek">{document.dek}</AnimatedLines><small className="article-author">{authorHref ? <Link href={authorHref}>{author}</Link> : author}</small>{topics.length ? <div className="article-topics" aria-label="Θέματα άρθρου">{topics.map((topic) => <span key={topic.slug}>{topic.name}</span>)}</div> : null}</header>
    {featuredImage ? <MediaFigure image={featuredImage} alt={featuredImage.alt || title} variant="cover" /> : null}
    {mode === "sidebar" ? <div className="article-sidebar-layout"><div>{body}</div><aside aria-label="Σχετικές ιστορίες"><AnimatedLines>Στο ίδιο αρχείο</AnimatedLines><AnimatedHeadline>Σχετικά άρθρα</AnimatedHeadline><div className="article-sidebar-related">{relatedStories.slice(0, 5).map((story) => <article key={story.slug}>
      {story.image ? <Link className="article-sidebar-related__image" href={`/posts/${story.slug}`} aria-label={`${story.title}, άρθρο`}><ClipReveal className="article-image__reveal"><ParallaxMedia><Image src={story.image.url} alt={story.image.alt || story.title} width={story.image.width || 640} height={story.image.height || 420} unoptimized loading="lazy" sizes="(max-width: 700px) 100vw, 25vw" /></ParallaxMedia></ClipReveal></Link> : null}
      <div>{story.author || story.publishedLabel ? <small>{[story.author, story.publishedLabel].filter(Boolean).join(" · ")}</small> : null}<h3><Link href={`/posts/${story.slug}`}>{story.title}</Link></h3></div>
    </article>)}</div></aside></div> : body}
  </article>;
}
const Longform = (props: ArticleViewProps) => <Shell {...props} mode="longform" />;
const Matchday = (props: ArticleViewProps) => <Shell {...props} mode="matchday" />;
const Gallery = (props: ArticleViewProps) => <Shell {...props} mode="gallery" />;
const Interview = (props: ArticleViewProps) => <Shell {...props} mode="interview" />;
const Cinematic = (props: ArticleViewProps) => <Shell {...props} mode="cinematic" />;
const Chess = (props: ArticleViewProps) => <Shell {...props} mode="chess" />;
const Sidebar = (props: ArticleViewProps) => <Shell {...props} mode="sidebar" />;

export const articleTemplateRegistry = { longform: Longform, matchday: Matchday, gallery: Gallery, interview: Interview, cinematic: Cinematic, chess: Chess, sidebar: Sidebar } satisfies Record<ArticleTemplateKey, ComponentType<ArticleViewProps>>;
export function ArticleDispatcher({ templateKey, ...props }: ArticleViewProps & { templateKey: ArticleTemplateKey }) { const Template = articleTemplateRegistry[templateKey] ?? Longform; return <Template {...props} />; }
