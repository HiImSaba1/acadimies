import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { RowDataPacket } from "mysql2";
import { readServerEnvironment } from "../src/lib/env/server";

type ExistingRow = RowDataPacket & { id: string };
type LocalImage = { filename: string; byteSize: number; width: number | null; height: number | null; checksum: string };

async function inspectLocalImages(): Promise<LocalImage[]> {
  const directory = join(process.cwd(), "public", "webp");
  const entries = await readdir(directory, { withFileTypes: true });
  const images: LocalImage[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    if (!entry.isFile() || !/^[a-zA-Z0-9_-]+\.webp$/.test(entry.name)) continue;
    const path = join(directory, entry.name);
    const [bytes, file] = await Promise.all([readFile(path), stat(path)]);
    const dimensions = await sharp(bytes).metadata();
    if (dimensions.format !== "webp") throw new Error(`Invalid WEBP file: ${entry.name}`);
    images.push({ filename: entry.name, byteSize: file.size, width: dimensions.width ?? null,
      height: dimensions.height ?? null, checksum: createHash("sha256").update(bytes).digest("hex") });
  }
  return images;
}

async function register() {
  const images = await inspectLocalImages();
  const apply = process.env.ACADIMIES_REGISTER_DEMO_APPLY === "1";
  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", candidateImages: images.length, databaseWrites: false, filesCopied: false, mediaDownloads: false }, null, 2));
    return;
  }
  const environment = readServerEnvironment();
  const databaseName = new URL(environment.DATABASE_URL).pathname.replace(/^\//, "");
  if (databaseName !== "next_acadimies") throw new Error("Media registration target must be next_acadimies.");
  const { pool } = await import("../src/db");
  let inserted = 0;
  let alreadyRegistered = 0;
  try {
    for (const image of images) {
      const storageKey = `local-webp/${image.filename}`;
      const [existing] = await pool.query<ExistingRow[]>("SELECT id FROM media_assets WHERE storage_key = ? LIMIT 1", [storageKey]);
      if (existing.length) { alreadyRegistered += 1; continue; }
      try {
        await pool.query(
          "INSERT INTO media_assets (id, storage_key, public_url, original_url, mime_type, byte_size, width, height, alt_text, checksum_sha256, legacy_wordpress_id, created_at, updated_at) VALUES (UUID(), ?, ?, NULL, 'image/webp', ?, ?, ?, NULL, ?, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))",
          [storageKey, `/webp/${image.filename}`, image.byteSize, image.width, image.height, image.checksum],
        );
        inserted += 1;
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
          alreadyRegistered += 1;
          continue;
        }
        throw error;
      }
    }
    console.log(JSON.stringify({ mode: "apply", database: databaseName, candidateImages: images.length,
      inserted, alreadyRegistered, filesCopied: false, mediaDownloads: false,
      altTextPolicy: "unset; add contextual alt text before editorial use" }, null, 2));
  } finally {
    await pool.end();
  }
}

register().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "media-registration-failed";
  console.error(`Local WEBP registration failed (${code}). No credentials or image contents were printed.`);
  process.exitCode = 1;
});
