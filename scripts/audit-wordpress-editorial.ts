import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { inspectWordPressExport } from "../src/features/wordpress-import/inspect";
import { createWordPressEditorialAudit } from "../src/features/wordpress-import/editorial-audit";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

async function main() {
  const source = resolve(option("--source") ?? "WordPress.2026-09-14.xml");
  if (extname(source).toLowerCase() !== ".xml") throw new Error("Expected a WXR XML source.");
  const xml = await readFile(source, "utf8");
  const inspection = inspectWordPressExport(xml);
  if (!/^https?:\/\/(?:www\.)?acadimies\.gr\/?$/i.test(inspection.source.siteUrl)) {
    throw new Error("Unexpected WXR site origin.");
  }
  const sampleLimit = Number(option("--samples") ?? "12");
  const report = { sourceFile: basename(source), sourceSha256: createHash("sha256").update(xml).digest("hex"),
    ...createWordPressEditorialAudit(inspection, sampleLimit) };
  const output = option("--output");
  if (output) {
    const path = resolve(output);
    await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    process.stdout.write(`${JSON.stringify({ outputPath: path, ...report.reconciliation, databaseWrites: false, mediaDownloads: false }, null, 2)}\n`);
  } else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress editorial audit failed: ${error instanceof Error ? error.message : "Unknown error."}\n`);
  process.exitCode = 1;
});
