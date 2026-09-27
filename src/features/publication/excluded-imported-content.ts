const excludedImportedTitles = [
  { match: "prefix", value: "Find your style Favorites" },
  { match: "prefix", value: "Where to find the hottest gentle" },
  { match: "exact", value: "Home" },
  { match: "exact", value: "Home - mobile" },
] as const;

function normalizeTitle(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

export function isExcludedImportedTitle(title: string) {
  const normalized = normalizeTitle(title);
  return excludedImportedTitles.some((target) => {
    const value = normalizeTitle(target.value);
    return target.match === "exact" ? normalized === value : normalized.startsWith(value);
  });
}
