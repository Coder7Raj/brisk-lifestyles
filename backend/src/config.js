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
};
