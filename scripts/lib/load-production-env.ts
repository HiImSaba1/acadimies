import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

export function loadProductionEnvironment(options: { required?: boolean } = {}) {
  const localPath = resolve(process.cwd(), ".env");
  const productionPath = resolve(process.cwd(), ".env.production.local");
  if (existsSync(localPath)) config({ path: localPath, override: false });
  if (!existsSync(productionPath)) {
    if (options.required) throw new Error("Missing .env.production.local in the application root.");
    return { loaded: existsSync(localPath), path: productionPath };
  }
  config({ path: productionPath, override: true });
  return { loaded: true, path: productionPath };
}
