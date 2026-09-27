export const adminArticleSorts = ["recent", "oldest", "az", "za"] as const;
export type AdminArticleSort = (typeof adminArticleSorts)[number];
export const adminArticleStatuses = ["all", "draft", "review", "scheduled", "published", "archived"] as const;
export type AdminArticleStatus = (typeof adminArticleStatuses)[number];

export function parseAdminArticleYear(value: string): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= 2000 && year <= 2100 ? year : null;
}

export function parseAdminArticleSort(value: string | string[] | undefined): AdminArticleSort {
  const candidate = Array.isArray(value) ? value[0] : value;
  return adminArticleSorts.includes(candidate as AdminArticleSort) ? candidate as AdminArticleSort : "recent";
}

export function parseAdminArticleStatus(value: string | string[] | undefined): AdminArticleStatus {
  const candidate = Array.isArray(value) ? value[0] : value;
  return adminArticleStatuses.includes(candidate as AdminArticleStatus) ? candidate as AdminArticleStatus : "all";
}

export function parseAdminArticleSearch(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.trim().replace(/\s+/g, " ").slice(0, 100) ?? "";
}

export function parseAdminArticlePage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d+$/.test(candidate)) return 1;
  const page = Number(candidate);
  return Number.isSafeInteger(page) && page > 0 && page <= 10_000 ? page : 1;
}

export function articleArchiveYear(input: {
  publishedAt: Date | null;
  scheduledFor?: Date | null;
  createdAt: Date;
}): number {
  return (input.publishedAt ?? input.scheduledFor ?? input.createdAt).getUTCFullYear();
}
