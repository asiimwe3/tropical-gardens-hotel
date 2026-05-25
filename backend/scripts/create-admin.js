import bcrypt from "bcryptjs";
import { config } from "../src/config.js";
import { query, pool } from "../src/db.js";

if (!config.adminEmail || !config.adminPassword) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

const hash = await bcrypt.hash(config.adminPassword, 12);
await query(
  `insert into admin_users (email, password_hash, role)
   values ($1, $2, 'admin')
   on conflict (email) do update set password_hash = excluded.password_hash`,
  [config.adminEmail.toLowerCase(), hash]
);

await pool.end();
console.log(`Admin user ready: ${config.adminEmail}`);
