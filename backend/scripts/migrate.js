import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/pool.js";

try {
  for (const file of ["migrations/20261110_prices_in_taka.sql", "schema.sql", "users.sql", "migrations/20261110_sslcommerz.sql"]) {
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
