import { createHash, timingSafeEqual } from "node:crypto";

export function readScheduledPublisherSecret(
  environment: Record<string, string | undefined> = process.env,
): string | null {
  const value = environment.SCHEDULED_PUBLISH_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function scheduledPublicationLimit(value: string | undefined): number {
  const requested = Number(value ?? 25);
  return Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 25;
}

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isScheduledPublisherAuthorized(
  authorizationHeader: string | null,
  secret: string,
): boolean {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return false;
  return timingSafeEqual(digest(match[1]), digest(secret));
}
