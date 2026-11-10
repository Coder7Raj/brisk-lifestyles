import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;
export function createPool(connectionString = config.databaseUrl) {
  return new Pool({
    connectionString,
    ssl: config.dbSsl ? { rejectUnauthorized: true } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export const pool = createPool();
pool.on("error", (error) =>
  console.error("Unexpected idle PostgreSQL error:", error.message),
);
