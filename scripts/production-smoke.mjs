const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

const base = option("--base-url");
const postPath = option("--post-path");
if (!base || !postPath || !postPath.startsWith("/posts/") || args.length !== 4) {
  process.stderr.write("Usage: node scripts/production-smoke.mjs --base-url https://example.com --post-path /posts/published-slug\n");
  process.exit(2);
}

let origin;
try {
  const url = new URL(base);
  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Invalid base URL");
  }
  origin = url.origin;
  const post = new URL(postPath, origin);
  if (post.origin !== origin || !/^\/posts\/[a-z0-9][a-z0-9-]*\/?$/.test(post.pathname)) throw new Error("Invalid post path");
} catch {
  process.stderr.write("Provide a site origin and a simple published post path.\n");
  process.exit(2);
}

async function check(path, inspect) {
  const response = await fetch(new URL(path, origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { "Cache-Control": "no-cache" },
  });
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`);
  const content = await response.text();
  if (inspect && !inspect(content, response)) throw new Error(`${path}: unexpected response`);
  process.stdout.write(`PASS ${path}\n`);
  return content;
}

try {
  await check("/api/health/live", (body) => JSON.parse(body).ok === true);
  await check("/api/health", (body) => {
    const result = JSON.parse(body);
    return result.ok === true && result.database === "reachable";
  });
  const homepage = await check("/", (body, response) => response.headers.get("content-type")?.includes("text/html") && body.includes("<html"));
  await check("/admin/login", (body, response) => response.headers.get("content-type")?.includes("text/html") && body.includes("<html"));
  await check(postPath, (body, response) => response.headers.get("content-type")?.includes("text/html") && body.includes("<html"));
  const assetPath = homepage.match(/(?:src|href)="(\/_next\/static\/[^"?]+)(?:\?[^\"]*)?"/)?.[1];
  if (!assetPath) throw new Error("/: no Next.js static asset reference found");
  await check(assetPath);
  process.stdout.write("PASS production smoke checks\n");
} catch (error) {
  process.stderr.write(`FAIL production smoke: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
}
