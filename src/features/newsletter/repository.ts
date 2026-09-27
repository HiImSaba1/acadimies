import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaigns, newsletterConsentEvents, newsletterOutbox, newsletterSubscribers } from "@/db/schema";
import type { z } from "zod";
import type { campaignDraftSchema } from "./contracts";

const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

export async function requestNewsletterSubscription(input: { email: string; source: string; ipHash: string | null; userAgent: string | null }) {
  const confirmationToken = randomBytes(32).toString("base64url");
  const unsubscribeToken = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, input.email)).limit(1);
    if (existing?.status === "confirmed") return { state: "confirmed" as const };
    const subscriberId = existing?.id ?? randomUUID();
    if (existing) {
      await tx.update(newsletterSubscribers).set({ status: "pending", consentSource: input.source, consentIpHash: input.ipHash, confirmationTokenHash: hashToken(confirmationToken), confirmationExpiresAt: expiresAt, unsubscribeTokenHash: hashToken(unsubscribeToken), consentedAt: now, confirmedAt: null, unsubscribedAt: null }).where(eq(newsletterSubscribers.id, subscriberId));
    } else {
      await tx.insert(newsletterSubscribers).values({ id: subscriberId, email: input.email, status: "pending", consentSource: input.source, consentIpHash: input.ipHash, confirmationTokenHash: hashToken(confirmationToken), confirmationExpiresAt: expiresAt, unsubscribeTokenHash: hashToken(unsubscribeToken), consentedAt: now });
    }
    await tx.insert(newsletterConsentEvents).values({ id: randomUUID(), subscriberId, event: existing ? "resubscribed" : "requested", source: input.source, ipHash: input.ipHash, userAgent: input.userAgent });
    await tx.insert(newsletterOutbox).values({ id: randomUUID(), subscriberId, kind: "double_opt_in", dedupeKey: `double-opt-in:${subscriberId}:${hashToken(confirmationToken).slice(0, 16)}`, recipientEmail: input.email, payload: { confirmationToken, unsubscribeToken, expiresAt: expiresAt.toISOString() } });
    return { state: "pending" as const };
  });
}

export async function listNewsletterOverview() {
  const [subscribers, campaigns, counts] = await Promise.all([
    db.select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, status: newsletterSubscribers.status, consentedAt: newsletterSubscribers.consentedAt, confirmedAt: newsletterSubscribers.confirmedAt }).from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(100),
    db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.updatedAt)).limit(50),
    db.select({ status: newsletterSubscribers.status, total: sql<number>`count(*)` }).from(newsletterSubscribers).groupBy(newsletterSubscribers.status),
  ]);
  return { subscribers, campaigns, counts };
}

export async function createCampaignDraft(input: z.infer<typeof campaignDraftSchema>, actorId: string) {
  const id = randomUUID();
  await db.insert(newsletterCampaigns).values({ id, createdBy: actorId, title: input.title, subject: input.subject, previewText: input.previewText || null, contentDocument: { version: 1, blocks: [{ type: "paragraph", text: input.body }] }, status: "draft" });
  return id;
}

export async function confirmNewsletterSubscription(token: string) {
  const tokenHash = hashToken(token);
  return db.transaction(async (tx) => {
    const [subscriber] = await tx.select().from(newsletterSubscribers).where(and(eq(newsletterSubscribers.confirmationTokenHash, tokenHash), eq(newsletterSubscribers.status, "pending"), gt(newsletterSubscribers.confirmationExpiresAt, new Date()))).limit(1);
    if (!subscriber) return false;
    await tx.update(newsletterSubscribers).set({ status: "confirmed", confirmedAt: new Date(), confirmationTokenHash: null, confirmationExpiresAt: null }).where(eq(newsletterSubscribers.id, subscriber.id));
    await tx.insert(newsletterConsentEvents).values({ id: randomUUID(), subscriberId: subscriber.id, event: "confirmed", source: "email-link" });
    return true;
  });
}

export async function unsubscribeNewsletter(token: string) {
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeTokenHash, hashToken(token))).limit(1);
  if (!subscriber) return false;
  await db.transaction(async (tx) => {
    await tx.update(newsletterSubscribers).set({ status: "unsubscribed", unsubscribedAt: new Date(), confirmationTokenHash: null, confirmationExpiresAt: null }).where(eq(newsletterSubscribers.id, subscriber.id));
    await tx.insert(newsletterConsentEvents).values({ id: randomUUID(), subscriberId: subscriber.id, event: "unsubscribed", source: "email-link" });
    await tx.update(newsletterOutbox).set({ status: "suppressed" }).where(and(eq(newsletterOutbox.subscriberId, subscriber.id), eq(newsletterOutbox.status, "pending")));
  });
  return true;
}
