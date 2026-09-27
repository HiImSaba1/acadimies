import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import {
  createSafeInspectionReport,
  inspectWordPressExport,
} from "../src/features/wordpress-import/inspect";

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}

async function main(): Promise<void> {
  const sourcePath = resolve(
    argumentValue("--source") ?? "WordPress.2026-09-14.xml",
  );
  const outputPath = resolve(
    argumentValue("--output") ??
      "artifacts/verification/sprint-01-wordpress-inspection.json",
  );

  if (!existsSync(sourcePath) || !sourcePath.toLowerCase().endsWith(".xml")) {
    throw new Error(`WordPress WXR source not found: ${sourcePath}`);
  }

  const xml = await readFile(sourcePath, "utf8");
  const inspection = inspectWordPressExport(xml);
  const safeReport = {
    sourceFile: basename(sourcePath),
    sourceSha256: await sha256File(sourcePath),
    inspectedAt: new Date().toISOString(),
    writesPerformed: false,
    ...createSafeInspectionReport(inspection),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(safeReport, null, 2)}\n`, "utf8");

  process.stdout.write(
    `${JSON.stringify({ outputPath, ...safeReport.totals }, null, 2)}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`WordPress inspection failed: ${message}\n`);
  process.exitCode = 1;
});
