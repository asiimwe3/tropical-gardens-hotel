import pg from "pg";
import { config } from "./config.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false
});

export async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (config.nodeEnv !== "production") {
    console.log("db", { rows: result.rowCount, ms: Date.now() - start });
  }
  return result;
}
