import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

await client.connect();

try {
  const schema = await readFile(path.join(rootDir, "db", "schema.sql"), "utf8");
  const seed = await readFile(path.join(rootDir, "db", "seed.sql"), "utf8");
  await client.query(schema);
  await client.query(seed);
  console.log("Database schema and seed data ready.");
} finally {
  await client.end();
}
