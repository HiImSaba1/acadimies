import "dotenv/config";

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

type ClientReferenceManifest = {
  entryJSFiles: Record<string, string[]>;
  entryCSSFiles: Record<string, Array<{ path: string }>>;
};

const routeEntries = ["[project]/src/app/layout", "[project]/src/app/template", "[project]/src/app/page"];

async function totalBytes(root: string, paths: string[]) {
  const unique = [...new Set(paths)];
  const sizes = await Promise.all(unique.map(async (path) => (await stat(resolve(root, path))).size));
  return { files: unique.length, bytes: sizes.reduce((sum, size) => sum + size, 0) };
}

async function main() {
  const distDirectory = resolve(process.cwd(), process.env.NEXT_DIST_DIR ?? ".next");
  const manifestPath = resolve(distDirectory, "server/app/page_client-reference-manifest.js");
  const source = await readFile(manifestPath, "utf8");
  const marker = 'globalThis.__RSC_MANIFEST["/page"] = ';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Homepage client-reference manifest is invalid.");
  const manifest = JSON.parse(source.slice(start + marker.length).replace(/;\s*$/, "")) as ClientReferenceManifest;
  const jsPaths = routeEntries.flatMap((entry) => manifest.entryJSFiles[entry] ?? []);
  const cssPaths = routeEntries.flatMap((entry) => (manifest.entryCSSFiles[entry] ?? []).map((file) => file.path));
  const [javascript, css] = await Promise.all([
    totalBytes(distDirectory, jsPaths),
    totalBytes(distDirectory, cssPaths),
  ]);
  const budgets = {
    javascriptBytes: Number(process.env.ACADIMIES_JS_BUDGET_BYTES ?? 307_200),
    cssBytes: Number(process.env.ACADIMIES_CSS_BUDGET_BYTES ?? 184_320),
  };
  const withinBudget = javascript.bytes <= budgets.javascriptBytes && css.bytes <= budgets.cssBytes;
  process.stdout.write(`${JSON.stringify({ mode: "production-homepage-static-budget", route: "/",
    measurement: "uncompressed unique initial assets", javascript, css, budgets, withinBudget }, null, 2)}\n`);
  if (!withinBudget) throw new Error("Homepage production asset budget exceeded.");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Performance budget inspection failed."}\n`);
  process.exitCode = 1;
});
