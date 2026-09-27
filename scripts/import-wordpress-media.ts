import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { inspectWordPressExport } from "../src/features/wordpress-import/inspect";
import { createWordPressMediaPlan, safeWordPressImageUrl, type WordPressMediaCandidate } from "../src/features/wordpress-import/media-plan";
import { wordpressMediaStorage } from "../src/features/wordpress-import/media-storage";

const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024;
const PUBLIC_DIRECTORY = resolve(process.cwd(), "public");

function option(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  return position < 0 ? undefined : process.argv[position + 1];
}

async function digestFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function downloadWebp(url: string): Promise<{ bytes: Buffer; width: number; height: number }> {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.body) throw new Error(`Image request returned HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!contentType || !["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"].includes(contentType)) {
    await response.body.cancel();
    throw new Error("Remote response is not an allowed image type.");
  }
  const claimedSize = Number(response.headers.get("content-length"));
  if (claimedSize > MAX_DOWNLOAD_BYTES) {
    await response.body.cancel();
    throw new Error("Remote image exceeds the size limit.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_DOWNLOAD_BYTES) throw new Error("Remote image exceeds the size limit.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const pipeline = sharp(Buffer.concat(chunks), { limitInputPixels: 45_000_000 }).rotate();
  const bytes = await pipeline.resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 }).toBuffer();
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Converted image has no valid dimensions.");
  return { bytes, width: metadata.width, height: metadata.height };
}

async function applyCandidates(sourceSha256: string, candidates: WordPressMediaCandidate[], batchSize: number, delayMs: number) {
  const [{ db, pool }, { legacyImportBatches, legacyImportRecords, mediaAssets }, { and, eq }] = await Promise.all([
    import("../src/db"), import("../src/db/schema"), import("drizzle-orm"),
  ]);
  const result = { attempted: 0, imported: 0, alreadyImported: 0, reviewLocked: 0, failed: [] as Array<{ externalId: string; reason: string }> };
  try {
    const batch = await db.query.legacyImportBatches.findFirst({ where: eq(legacyImportBatches.sourceSha256, sourceSha256) });
    if (!batch || batch.state !== "review") throw new Error("Apply the matching WXR staging ledger before downloading media.");
    const totalBatches = Math.ceil(candidates.length / batchSize);
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchCandidates = candidates.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
      for (const candidate of batchCandidates) {
        result.attempted++;
        try {
        const record = await db.query.legacyImportRecords.findFirst({ where: and(
          eq(legacyImportRecords.batchId, batch.id), eq(legacyImportRecords.sourceType, "attachment"),
          eq(legacyImportRecords.externalId, candidate.externalId),
        ) });
        if (!record || !["staged", "approved"].includes(record.state) || record.riskFlags.length ||
            record.checksumSha256 !== candidate.checksumSha256 ||
            safeWordPressImageUrl(String(record.payload.attachmentUrl ?? "")) !== candidate.url) {
          result.reviewLocked++;
          continue;
        }
        const legacyId = Number(candidate.externalId);
        const storage = wordpressMediaStorage(candidate);
        if (!storage) throw new Error("Attachment has no trustworthy WordPress year/month.");
        const { storageKey, publicUrl } = storage;
        const filePath = join(PUBLIC_DIRECTORY, ...storageKey.split("/"));
        await mkdir(dirname(filePath), { recursive: true });
        const existing = await db.query.mediaAssets.findFirst({ where: eq(mediaAssets.legacyWordPressId, legacyId) });
        if (existing) {
          if (existing.storageKey !== storageKey || existing.publicUrl !== publicUrl || !existing.checksumSha256 ||
              existing.checksumSha256 !== await digestFile(filePath)) throw new Error("Existing media record or file needs manual reconciliation.");
          result.alreadyImported++;
          continue;
        }
        let bytes: Buffer;
        let width: number;
        let height: number;
        try {
          bytes = await readFile(filePath);
          const meta = await sharp(bytes).metadata();
          if (meta.format !== "webp" || !meta.width || !meta.height) throw new Error("Existing file is not a valid WebP.");
          width = meta.width;
          height = meta.height;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          const converted = await downloadWebp(candidate.url);
          bytes = converted.bytes;
          width = converted.width;
          height = converted.height;
          try {
            await writeFile(filePath, bytes, { flag: "wx" });
          } catch (writeError) {
            if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError;
            bytes = await readFile(filePath);
            const meta = await sharp(bytes).metadata();
            if (meta.format !== "webp" || !meta.width || !meta.height) throw new Error("Concurrent file needs manual reconciliation.");
            width = meta.width;
            height = meta.height;
          }
        }
        await db.insert(mediaAssets).values({
          id: randomUUID(), storageKey, publicUrl, originalUrl: candidate.url,
          mimeType: "image/webp", byteSize: bytes.byteLength, width, height,
          altText: candidate.title.slice(0, 512), checksumSha256: createHash("sha256").update(bytes).digest("hex"),
          legacyWordPressId: legacyId,
        });
        result.imported++;
        } catch (error) {
          result.failed.push({ externalId: candidate.externalId, reason: error instanceof Error ? error.message : "Unknown import failure." });
        }
      }
      process.stdout.write(`${JSON.stringify({ event: "media-batch-complete", batch: batchIndex + 1, totalBatches,
        attempted: result.attempted, imported: result.imported, alreadyImported: result.alreadyImported,
        reviewLocked: result.reviewLocked, failed: result.failed.length })}\n`);
      if (delayMs > 0 && batchIndex + 1 < totalBatches) await delay(delayMs);
    }
    return result;
  } finally {
    await pool.end();
  }
}

async function main() {
  const sourcePath = resolve(option("--source") ?? "WordPress.2026-09-14.xml");
  if (extname(sourcePath).toLowerCase() !== ".xml") throw new Error("WXR source must be XML.");
  const inspection = inspectWordPressExport(await readFile(sourcePath, "utf8"));
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(inspection.source.siteUrl)) throw new Error("Unexpected WXR site origin.");
  const sourceSha256 = await digestFile(sourcePath);
  const plan = createWordPressMediaPlan(inspection);
  const apply = process.env.ACADIMIES_WP_MEDIA_APPLY === "1";
  const automatic = process.env.ACADIMIES_WP_MEDIA_AUTO === "1";
  const requestedIds = (process.env.ACADIMIES_WP_MEDIA_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (requestedIds.some((id) => !/^[1-9]\d*$/.test(id))) throw new Error("ACADIMIES_WP_MEDIA_IDS must contain comma-separated positive WordPress IDs.");
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", sourceFile: basename(sourcePath), sourceSha256,
      ...plan.counts, databaseWrites: false, mediaDownloads: false, publicContentWrites: false }, null, 2)}\n`);
    return;
  }
  const rawLimit = Number(option("--limit") ?? "20");
  if (!Number.isSafeInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) throw new Error("--limit must be between 1 and 50.");
  const rawOffset = Number(option("--offset") ?? "0");
  if (!Number.isSafeInteger(rawOffset) || rawOffset < 0) throw new Error("--offset must be a non-negative integer.");
  const selected = requestedIds.length
    ? plan.candidates.filter((candidate) => requestedIds.includes(candidate.externalId))
    : automatic ? plan.candidates : plan.candidates.slice(rawOffset, rawOffset + rawLimit);
  if (requestedIds.length && selected.length !== new Set(requestedIds).size) {
    throw new Error("One or more requested WordPress media IDs are not eligible in this WXR file.");
  }
  const result = await applyCandidates(sourceSha256, selected, rawLimit, automatic ? 2000 : 0);
  process.stdout.write(`${JSON.stringify({ mode: requestedIds.length ? "targeted-retry" : automatic ? "automatic-batched-apply" : "bounded-apply",
    sourceSha256, eligible: plan.counts.eligible, offset: automatic ? 0 : rawOffset,
    limit: automatic ? selected.length : rawLimit, batchSize: rawLimit, delayMs: automatic ? 2000 : 0,
    ...result, publicContentWrites: false }, null, 2)}\n`);
  if (result.failed.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress media import failed: ${error instanceof Error ? error.message : "Unknown failure."}\n`);
  process.exitCode = 1;
});
