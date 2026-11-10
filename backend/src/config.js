import "dotenv/config";

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be a valid TCP port.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
  dbSsl: process.env.DB_SSL === "true",
  jwtSecret: process.env.JWT_SECRET || "",
  sslcommerzStoreId: process.env.SSLCOMMERZ_STORE_ID || "",
  sslcommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
  sslcommerzSandbox: process.env.SSLCOMMERZ_SANDBOX !== "false",
  publicApiUrl: process.env.PUBLIC_API_URL || "",
  webUrl: process.env.WEB_ORIGIN || "http://localhost:5173",
};

if (config.jwtSecret.length < 32)
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
