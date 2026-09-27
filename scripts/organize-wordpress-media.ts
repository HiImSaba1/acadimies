import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { eq, like } from "drizzle-orm";
import { db, pool } from "../src/db";
import { auditEvents, mediaAssets } from "../src/db/schema";
import { wordpressMediaStorage } from "../src/features/wordpress-import/media-storage";

const PUBLIC_DIRECTORY = resolve(process.cwd(), "public");

async function checksum(path: string): Promise<string | null> {
  try {
    return createHash("sha256").update(await readFile(path)).digest("hex");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function main() {
  const apply = process.env.ACADIMIES_WP_MEDIA_ORGANIZE_APPLY === "1";
  const rows = await db.select().from(mediaAssets)
    .where(like(mediaAssets.storageKey, "wordpress-media/%"));
  const result = { candidates: rows.length, readyToOrganize: 0, organized: 0, recoveredAtTarget: 0, missingSource: 0,
    unresolvableDate: 0, checksumMismatch: 0, failures: [] as Array<{ legacyWordPressId: number | null; reason: string }> };

  try {
    for (const row of rows) {
      const externalId = row.legacyWordPressId ? String(row.legacyWordPressId) : "";
      const storage = row.originalUrl ? wordpressMediaStorage({ externalId, url: row.originalUrl }) : null;
      if (!storage) { result.unresolvableDate++; continue; }
      const sourcePath = join(PUBLIC_DIRECTORY, ...row.storageKey.split("/"));
      const targetPath = join(PUBLIC_DIRECTORY, ...storage.storageKey.split("/"));
      const sourceChecksum = await checksum(sourcePath);
      const targetChecksum = await checksum(targetPath);
      if (!sourceChecksum) {
        if (targetChecksum && targetChecksum === row.checksumSha256) {
          if (apply) {
            await db.update(mediaAssets).set({ storageKey: storage.storageKey, publicUrl: storage.publicUrl })
              .where(eq(mediaAssets.id, row.id));
            result.recoveredAtTarget++;
          } else result.readyToOrganize++;
        } else result.missingSource++;
        continue;
      }
      if (row.checksumSha256 && sourceChecksum !== row.checksumSha256) { result.checksumMismatch++; continue; }
      if (!apply) { result.readyToOrganize++; continue; }
      try {
        await mkdir(dirname(targetPath), { recursive: true });
        if (targetChecksum && targetChecksum !== sourceChecksum) throw new Error("Target exists with a different checksum.");
        if (!targetChecksum) await copyFile(sourcePath, targetPath);
        await db.transaction(async (tx) => {
          await tx.update(mediaAssets).set({ storageKey: storage.storageKey, publicUrl: storage.publicUrl })
            .where(eq(mediaAssets.id, row.id));
          await tx.insert(auditEvents).values({
            id: randomUUID(), action: "migration.media_organized", entityType: "media_asset", entityId: row.id,
            metadata: { previousStorageKey: row.storageKey, storageKey: storage.storageKey,
              legacyWordPressId: row.legacyWordPressId },
          });
        });
        await unlink(sourcePath);
        result.organized++;
      } catch (error) {
        result.failures.push({ legacyWordPressId: row.legacyWordPressId,
          reason: error instanceof Error ? error.message : "Unknown organization failure." });
      }
    }
    process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "dry-run", ...result,
      databaseWrites: apply && result.organized + result.recoveredAtTarget > 0,
      filesMoved: apply ? result.organized : 0 }, null, 2)}\n`);
    if (result.failures.length || result.checksumMismatch || result.missingSource) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress media organization failed: ${error instanceof Error ? error.message : "Unknown failure."}\n`);
  process.exitCode = 1;
});
