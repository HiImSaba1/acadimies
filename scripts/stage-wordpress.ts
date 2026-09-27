import "dotenv/config";

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { inspectWordPressExport } from "../src/features/wordpress-import/inspect";
import { createWordPressStagePlan } from "../src/features/wordpress-import/stage";

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function sourceDigest(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  const sourcePath = resolve(argumentValue("--source") ?? "WordPress.2026-09-14.xml");
  if (extname(sourcePath).toLowerCase() !== ".xml") throw new Error("The source must be a WXR XML file.");
  const inspection = inspectWordPressExport(await readFile(sourcePath, "utf8"));
  const plan = createWordPressStagePlan(inspection);
  const sourceSha256 = await sourceDigest(sourcePath);
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(inspection.source.siteUrl)) {
    throw new Error("The WXR source site is not acadimies.gr.");
  }

  if (!process.argv.includes("--apply") && process.env.ACADIMIES_WP_STAGE_APPLY !== "1") {
    process.stdout.write(`${JSON.stringify({
      mode: "dry-run",
      sourceFile: basename(sourcePath),
      sourceSha256,
      ...plan.states,
      items: plan.items,
      databaseWrites: false,
      publicContentWrites: false,
      mediaDownloads: false,
    }, null, 2)}\n`);
    return;
  }

  const [{ persistWordPressStage }, { pool }] = await Promise.all([
    import("../src/features/wordpress-import/persist-stage"),
    import("../src/db"),
  ]);
  try {
    const result = await persistWordPressStage({ inspection, sourceFile: basename(sourcePath), sourceSha256 });
    process.stdout.write(`${JSON.stringify({
      mode: "staged-for-review",
      sourceFile: basename(sourcePath),
      sourceSha256,
      ...result,
      publicContentWrites: false,
      mediaDownloads: false,
    }, null, 2)}\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress staging failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
