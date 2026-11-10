import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, "backend", ".env") });

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be a valid TCP port.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
  dbSsl:
    process.env.DB_SSL === "true" ||
    /sslmode=(require|verify-ca|verify-full)/i.test(process.env.DATABASE_URL || ""),
  jwtSecret: process.env.JWT_SECRET || "",
  migrationDatabaseUrl: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  sslcommerzStoreId: process.env.SSLCOMMERZ_STORE_ID || "",
  sslcommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
  sslcommerzSandbox: process.env.SSLCOMMERZ_SANDBOX !== "false",
  publicApiUrl: process.env.PUBLIC_API_URL || "",
  webUrl: process.env.WEB_ORIGIN || "http://localhost:5173",
};

if (config.jwtSecret.length < 32)
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
