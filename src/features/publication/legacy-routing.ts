export function legacyCanonicalCandidates(slug: string): string[] {
  if (!/^[\p{L}\p{N}-]{1,191}$/u.test(slug)) return [];
  const pathSegments = [...new Set([slug, encodeURIComponent(slug)])];
  const origins = ["https://acadimies.gr", "http://acadimies.gr", "https://www.acadimies.gr"];
  return origins.flatMap((origin) => pathSegments.flatMap((part) => [`${origin}/${part}/`, `${origin}/${part}`]));
}

export function parseLegacyWordPressId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,19}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
