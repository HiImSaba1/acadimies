import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { readServerEnvironment } from "@/lib/env/server";
import * as schema from "./schema";

const globalForDatabase = globalThis as unknown as {
  acadimiesPool?: mysql.Pool;
};

function createPool(): mysql.Pool {
  const { DATABASE_URL } = readServerEnvironment();

  return mysql.createPool({
    uri: DATABASE_URL,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "Z",
    charset: "utf8mb4",
  });
}

export const pool = globalForDatabase.acadimiesPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.acadimiesPool = pool;
}

export const db = drizzle({ client: pool, schema, mode: "default" });

export type Database = typeof db;
