export function publicationDate(value?: string | null): { day: string; month: string; year: string; short: string; badgeMonth: string; badgeYear: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = new Intl.DateTimeFormat("el-GR", { year: "numeric", timeZone: "UTC" }).format(date);
  const badgeMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date).slice(0, 3);
  const badgeYear = `${year.slice(-2)}'`;
  return {
    day: new Intl.DateTimeFormat("el-GR", { day: "2-digit", timeZone: "UTC" }).format(date),
    month: new Intl.DateTimeFormat("el-GR", { month: "short", timeZone: "UTC" }).format(date),
    year,
    short: `${badgeMonth} ${badgeYear}`,
    badgeMonth,
    badgeYear,
  };
}

export function PublicationDateBadge({ value, previewValue, className = "shaped-story-card__date" }: { value?: string | null; previewValue?: string; className?: string }) {
  const date = publicationDate(value || previewValue);
  if (!date) return null;
  if (!value) return <span className={className} role="img" aria-label={`Ενδεικτική ημερομηνία σχεδιασμού ${date.short}`}>
    <span className="publication-date-badge__stack"><span>{date.badgeMonth}</span><span>{date.badgeYear}</span></span>
  </span>;
  return <time className={className} dateTime={value ?? undefined}
    aria-label={`Δημοσιεύτηκε ${date.day} ${date.month} ${date.year}`}>
    <span className="publication-date-badge__stack"><span>{date.badgeMonth}</span><span>{date.badgeYear}</span></span>
  </time>;
}
