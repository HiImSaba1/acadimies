export const categorySortValues = ["related", "recent", "oldest"] as const;
export type CategorySort = (typeof categorySortValues)[number];

export function parseCategorySort(value: unknown): CategorySort {
  return typeof value === "string" && categorySortValues.includes(value as CategorySort)
    ? value as CategorySort
    : "related";
}

export function parseCategoryPage(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= 10_000 ? page : 1;
}
