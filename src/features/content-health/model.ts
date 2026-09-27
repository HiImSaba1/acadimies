export const contentHealthIssueKeys = [
  "missing-author",
  "missing-featured-media",
  "missing-category",
  "missing-excerpt",
  "missing-seo-title",
  "missing-seo-description",
] as const;

export type ContentHealthIssue = (typeof contentHealthIssueKeys)[number];

export type ContentHealthCandidate = {
  authorId: string | null;
  featuredMediaId: string | null;
  categoryCount: number;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function articleHealthIssues(candidate: ContentHealthCandidate): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];
  if (!candidate.authorId) issues.push("missing-author");
  if (!candidate.featuredMediaId) issues.push("missing-featured-media");
  if (candidate.categoryCount < 1) issues.push("missing-category");
  if (!candidate.excerpt?.trim()) issues.push("missing-excerpt");
  if (!candidate.seoTitle?.trim()) issues.push("missing-seo-title");
  if (!candidate.seoDescription?.trim()) issues.push("missing-seo-description");
  return issues;
}

export const contentHealthIssueLabels: Record<ContentHealthIssue, string> = {
  "missing-author": "Χωρίς συντάκτη",
  "missing-featured-media": "Χωρίς κεντρική εικόνα",
  "missing-category": "Χωρίς κατηγορία",
  "missing-excerpt": "Χωρίς απόσπασμα",
  "missing-seo-title": "Χωρίς SEO τίτλο",
  "missing-seo-description": "Χωρίς SEO περιγραφή",
};
