import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { legacyImportBatches, legacyImportRecords } from "@/db/schema";
import type { WordPressInspection } from "./inspect";
import { createWordPressStagePlan, shouldRefreshStagedRecord } from "./stage";

export async function persistWordPressStage(input: {
  inspection: WordPressInspection;
  sourceFile: string;
  sourceSha256: string;
}) {
  const plan = createWordPressStagePlan(input.inspection);
  if (!/^[a-f0-9]{64}$/i.test(input.sourceSha256)) throw new Error("Invalid source checksum.");
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(input.inspection.source.siteUrl)) {
    throw new Error("The WXR source site is not acadimies.gr.");
  }
  if (plan.items !== input.inspection.totals.items) throw new Error("WXR item reconciliation failed.");

  const existingBatch = await db.query.legacyImportBatches.findFirst({
    where: eq(legacyImportBatches.sourceSha256, input.sourceSha256),
  });
  const batchId = existingBatch?.id ?? randomUUID();
  if (!existingBatch) {
    await db.insert(legacyImportBatches).values({
      id: batchId,
      sourceFile: input.sourceFile,
      sourceSha256: input.sourceSha256,
      sourceSiteUrl: input.inspection.source.siteUrl,
      state: "staging",
      totals: { items: plan.items, ...plan.states },
      startedAt: new Date(),
    });
  } else if (existingBatch.state === "completed") {
    throw new Error("This WXR batch is completed and cannot be restaged.");
  }

  const result = { batchId, inserted: 0, refreshed: 0, unchanged: 0, reviewLocked: 0, ...plan.states };
  for (const record of plan.records) {
    const existing = await db.query.legacyImportRecords.findFirst({
      where: and(
        eq(legacyImportRecords.batchId, batchId),
        eq(legacyImportRecords.sourceType, record.sourceType),
        eq(legacyImportRecords.externalId, record.externalId),
      ),
    });
    if (!existing) {
      await db.insert(legacyImportRecords).values({
        id: randomUUID(),
        batchId,
        externalId: record.externalId,
        sourceType: record.sourceType,
        checksumSha256: record.checksumSha256,
        state: record.state,
        sourceUrl: record.sourceUrl,
        riskFlags: record.riskFlags,
        payload: record.payload,
      });
      result.inserted++;
      continue;
    }
    if (shouldRefreshStagedRecord(existing.state, existing.checksumSha256, record.checksumSha256)) {
      await db.update(legacyImportRecords).set({
        checksumSha256: record.checksumSha256,
        state: record.state,
        sourceUrl: record.sourceUrl,
        riskFlags: record.riskFlags,
        payload: record.payload,
        error: null,
      }).where(eq(legacyImportRecords.id, existing.id));
      result.refreshed++;
    } else if (["approved", "promoted", "excluded"].includes(existing.state)) {
      result.reviewLocked++;
    } else {
      result.unchanged++;
    }
  }

  await db.update(legacyImportBatches).set({
    state: "review",
    totals: { items: plan.items, ...plan.states },
    completedAt: new Date(),
  }).where(eq(legacyImportBatches.id, batchId));
  return result;
}
