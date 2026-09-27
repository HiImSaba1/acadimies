import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { AnimatedLines } from "@/components/motion/AnimatedLines";

export function SectionHeading({ id, title, summary, inverse = false, reverse = false }: { id: string; title: string; summary: string; inverse?: boolean; reverse?: boolean }) {
  return (
    <header className="section-heading" data-inverse={inverse || undefined} data-reverse={reverse || undefined}>
      <div className="section-heading__title"><AnimatedHeadline id={id}>{title}</AnimatedHeadline></div>
      <div className="section-heading__summary"><AnimatedLines>{summary}</AnimatedLines></div>
    </header>
  );
}
