import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (typeof process.env.DATABASE_URL !== "string" || !process.env.DATABASE_URL.trim()) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running this script.");
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query(
  "delete from users where lower(email) like 'sample+%@buildcrew.invalid' returning id",
);
console.log(`Removed ${result.rowCount ?? 0} BuildCrew Lab profiles. Their sample projects were removed by cascading relations.`);
await pool.end();
