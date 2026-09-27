export type WordPressMediaStorage = {
  year: string;
  month: string;
  storageKey: string;
  publicUrl: string;
};

export function wordpressMediaStorage(input: {
  externalId: string;
  url: string;
  publishedAt?: string | null;
}): WordPressMediaStorage | null {
  if (!/^[1-9]\d*$/.test(input.externalId)) return null;
  const uploadDate = new URL(input.url).pathname.match(/\/uploads\/(20\d{2})\/(0[1-9]|1[0-2])\//);
  const fallbackValue = input.publishedAt?.trim() ?? "";
  const fallback = fallbackValue
    ? new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(fallbackValue)
      ? `${fallbackValue.replace(" ", "T")}Z`
      : fallbackValue)
    : null;
  const year = uploadDate?.[1] ?? (fallback && !Number.isNaN(fallback.getTime()) ? String(fallback.getUTCFullYear()) : null);
  const month = uploadDate?.[2] ?? (fallback && !Number.isNaN(fallback.getTime()) ? String(fallback.getUTCMonth() + 1).padStart(2, "0") : null);
  if (!year || !month || !/^20\d{2}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) return null;
  const storageKey = `images/${year}/${month}/${input.externalId}.webp`;
  return { year, month, storageKey, publicUrl: `/${storageKey}` };
}
