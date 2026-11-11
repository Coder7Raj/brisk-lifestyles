import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createPool } from "../src/db/pool.js";
import { config } from "../src/config.js";

const pool = createPool(config.migrationDatabaseUrl);

try {
  for (const file of ["migrations/20261110_prices_in_taka.sql", "schema.sql", "migrations/20261111_size_stock.sql", "users.sql", "migrations/20261110_sslcommerz.sql"]) {
    const schemaPath = fileURLToPath(
      new URL(`../../database/${file}`, import.meta.url),
    );
    const schema = await readFile(schemaPath, "utf8");
    await pool.query(schema);
  }
  console.log("Database schema is up to date.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
