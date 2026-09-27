import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditEvents, legacyImportBatches, legacyImportRecords } from "@/db/schema";
import type { ImportState } from "./stage";
import { canReviewLegacyRecord, reviewDestination, type ReviewDecision } from "./review-policy";

export const IMPORT_REVIEW_PAGE_SIZE = 25;

export type ImportReviewFilter = {
  page: number;
  state?: ImportState;
  sourceType?: string;
};

export async function getWordPressStagingOverview(filter: ImportReviewFilter) {
  const batches = await db.query.legacyImportBatches.findMany({
    orderBy: desc(legacyImportBatches.createdAt),
    limit: 10,
  });
  const latest = batches[0];
  const where = latest ? and(
    eq(legacyImportRecords.batchId, latest.id),
    filter.state ? eq(legacyImportRecords.state, filter.state) : undefined,
    filter.sourceType ? eq(legacyImportRecords.sourceType, filter.sourceType) : undefined,
  ) : undefined;
  const [countRow] = where ? await db.select({ total: sql<number>`count(*)` })
    .from(legacyImportRecords).where(where) : [{ total: 0 }];
  const stateRows = latest ? await db.select({ state: legacyImportRecords.state, total: sql<number>`count(*)` })
    .from(legacyImportRecords).where(eq(legacyImportRecords.batchId, latest.id)).groupBy(legacyImportRecords.state) : [];
  const records = where ? await db.query.legacyImportRecords.findMany({
    where,
    orderBy: [desc(legacyImportRecords.createdAt), desc(legacyImportRecords.id)],
    limit: IMPORT_REVIEW_PAGE_SIZE,
    offset: (filter.page - 1) * IMPORT_REVIEW_PAGE_SIZE,
  }) : [];
  return {
    batches: batches.map((batch) => ({
      id: batch.id,
      sourceFile: batch.sourceFile,
      sourceSha256: batch.sourceSha256,
      state: batch.state,
      totals: batch.totals,
      createdAt: batch.createdAt,
    })),
    records: records.map((record) => ({
      id: record.id,
      externalId: record.externalId,
      sourceType: record.sourceType,
      state: record.state,
      riskFlags: record.riskFlags,
      title: typeof record.payload.title === "string" ? record.payload.title : "",
    })),
    total: Number(countRow.total),
    stateCounts: Object.fromEntries(stateRows.map((row) => [row.state, Number(row.total)])) as Partial<Record<ImportState, number>>,
    page: filter.page,
    pageSize: IMPORT_REVIEW_PAGE_SIZE,
  };
}

export async function getWordPressReviewRecord(id: string) {
  const [record] = await db.select().from(legacyImportRecords).where(eq(legacyImportRecords.id, id)).limit(1);
  if (!record) return null;
  return {
    id: record.id,
    batchId: record.batchId,
    externalId: record.externalId,
    sourceType: record.sourceType,
    checksumSha256: record.checksumSha256,
    state: record.state,
    sourceUrl: record.sourceUrl,
    riskFlags: record.riskFlags,
    title: String(record.payload.title ?? ""),
    originalStatus: String(record.payload.status ?? ""),
    creatorLogin: String(record.payload.creatorLogin ?? ""),
    attachmentUrl: String(record.payload.attachmentUrl ?? ""),
    categories: Array.isArray(record.payload.categories) ? record.payload.categories : [],
    previewText: String(record.payload.sanitizedHtml ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000),
  };
}

export async function decideWordPressReview(input: {
  id: string;
  expectedState: ImportState;
  expectedChecksum: string;
  decision: ReviewDecision;
  actorId: string;
}) {
  return db.transaction(async (tx) => {
    const [record] = await tx.select().from(legacyImportRecords)
      .where(eq(legacyImportRecords.id, input.id)).limit(1).for("update");
    if (!record) return "missing" as const;
    if (record.state !== input.expectedState || record.checksumSha256 !== input.expectedChecksum) {
      return "stale" as const;
    }
    if (!canReviewLegacyRecord(record, input.decision)) return "forbidden-state" as const;

    const nextState = reviewDestination(input.decision);
    await tx.update(legacyImportRecords).set({ state: nextState })
      .where(eq(legacyImportRecords.id, record.id));
    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: input.actorId,
      action: `migration.${input.decision}`,
      entityType: "legacy_import_record",
      entityId: record.id,
      metadata: {
        batchId: record.batchId,
        externalId: record.externalId,
        sourceType: record.sourceType,
        checksumSha256: record.checksumSha256,
        previousState: record.state,
        state: nextState,
        riskFlags: record.riskFlags,
      },
    });
    return "updated" as const;
  });
}
