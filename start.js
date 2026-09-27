"use strict";

(async function start() {
  const [{ existsSync }, { resolve }, { loadEnvFile }, { createRequire }, { pathToFileURL }] = await Promise.all([
    import("node:fs"), import("node:path"), import("node:process"), import("node:module"), import("node:url"),
  ]);
  const projectRoot = __dirname;
  const productionEnvironment = resolve(projectRoot, ".env.production.local");
  if (!existsSync(productionEnvironment)) throw new Error("Missing .env.production.local in the application root.");

  loadEnvFile(productionEnvironment);
  process.env.NODE_ENV = "production";
  process.chdir(projectRoot);

  const resolveFromApplication = createRequire(__filename);
  const nextBinary = resolveFromApplication.resolve("next/dist/bin/next");
  const port = process.env.PORT || "3000";
  const hostname = process.env.ACADIMIES_HOST || "127.0.0.1";
  process.argv = [process.execPath, nextBinary, "start", "--hostname", hostname, "--port", port];
  await import(pathToFileURL(nextBinary).href);
})().catch((error) => {
  console.error(error instanceof Error ? error.message : "Acadimies startup failed.");
  process.exitCode = 1;
});
