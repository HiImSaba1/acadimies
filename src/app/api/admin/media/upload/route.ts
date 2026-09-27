import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { Metadata } from "sharp";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { authOptions } from "@/lib/auth/options";
import { can } from "@/lib/auth/permissions";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 300 * 1024;
const supportedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !can(session.user.role, "media:manage")) return json({ error: "Unauthorized" }, 401);

  const formData = await request.formData();
  const file = formData.get("file");
  const altText = String(formData.get("alt") ?? "").trim().slice(0, 512);
  if (!(file instanceof File)) return json({ error: "Missing image file." }, 400);
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) return json({ error: "Η εικόνα πρέπει να είναι έως 300KB." }, 400);

  const extension = supportedTypes[file.type as keyof typeof supportedTypes];
  if (!extension) return json({ error: "Υποστηρίζονται μόνο JPG, PNG και WEBP εικόνες." }, 400);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return json({ error: "Η εικόνα πρέπει να είναι έως 300KB." }, 400);

  let metadata: Metadata;
  try {
    metadata = await sharp(bytes, { limitInputPixels: 24_000_000 }).metadata();
  } catch {
    return json({ error: "Το αρχείο δεν αναγνωρίστηκε ως ασφαλής εικόνα." }, 400);
  }
  if (!metadata.width || !metadata.height) return json({ error: "Η εικόνα δεν έχει έγκυρες διαστάσεις." }, 400);

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = randomUUID();
  const fileName = `${id}.${extension}`;
  const relativeDirectory = join("images", "admin", year, month);
  const outputDirectory = join(process.cwd(), "public", relativeDirectory);
  const storageKey = `admin/${year}/${month}/${fileName}`;
  const publicUrl = `/images/admin/${year}/${month}/${fileName}`;
  const filePath = join(outputDirectory, fileName);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(filePath, bytes, { flag: "wx" });
  try {
    await db.insert(mediaAssets).values({
      id,
      uploaderId: session.user.id,
      storageKey,
      publicUrl,
      originalUrl: null,
      mimeType: file.type,
      byteSize: bytes.byteLength,
      width: metadata.width,
      height: metadata.height,
      altText: altText || null,
      checksumSha256: createHash("sha256").update(bytes).digest("hex"),
      legacyWordPressId: null,
    });
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    throw error;
  }

  return json({
    item: { id, url: publicUrl, alt: altText, label: storageKey, width: metadata.width, height: metadata.height },
    maxBytes: MAX_UPLOAD_BYTES,
  });
}
