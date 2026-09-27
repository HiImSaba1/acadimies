/** Normalize dates returned by database drivers and serialized server data. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toIsoDate(value: unknown): string | null {
  return toDate(value)?.toISOString() ?? null;
}

export function formatPublicationDate(value: unknown): string | null {
  return toDate(value)?.toLocaleDateString("el-GR", {
    day: "2-digit", month: "short", year: "numeric",
  }) ?? null;
}
