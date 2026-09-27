import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { readServerEnvironment } from "./src/lib/env/server";

config({ path: ".env.production.local", override: false, quiet: true });
config({ path: ".env.local", override: false, quiet: true });
config({ override: false, quiet: true });

const { DATABASE_URL: databaseUrl } = readServerEnvironment();

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
