const athensFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Athens", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function parts(date: Date) {
  return Object.fromEntries(athensFormatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function formatAthensDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const valueParts = parts(date);
  return `${valueParts.year}-${valueParts.month}-${valueParts.day}T${valueParts.hour}:${valueParts.minute}`;
}

export function parseAthensDateTimeLocal(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  const [hour, minute] = (timePart ?? "").split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const desiredUtc = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  let candidate = new Date(desiredUtc);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rendered = parts(candidate);
    const renderedUtc = Date.UTC(Number(rendered.year), Number(rendered.month) - 1, Number(rendered.day), Number(rendered.hour), Number(rendered.minute));
    candidate = new Date(candidate.getTime() + desiredUtc - renderedUtc);
  }
  return formatAthensDateTimeLocal(candidate) === value ? candidate.toISOString() : null;
}

export function isFutureSchedule(value: string | null, now = new Date()) {
  return Boolean(value && new Date(value).getTime() > now.getTime());
}
