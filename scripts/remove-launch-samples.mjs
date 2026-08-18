import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (typeof process.env.DATABASE_URL !== "string" || !process.env.DATABASE_URL.trim()) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running this script.");
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = await pool.connect();
try {
  await client.query("begin");

  const removed = await client.query(
    "delete from users where lower(email) like 'sample+%@buildcrew.invalid' returning id",
  );

  const realProjects = await client.query(`
    select p.name, p.project_language, p.lifecycle_status, pr.username
    from projects p
    join users u on u.id = p.owner_id
    left join profiles pr on pr.user_id = u.id
    where p.entry_type = 'PROJECT'
      and lower(u.email) not like 'sample+%@buildcrew.invalid'
    order by p.updated_at desc
  `);

  await client.query("commit");

  console.log(`Removed ${removed.rowCount ?? 0} BuildCrew Lab/sample profiles. Their sample projects were removed by cascading relations.`);
  console.log(`Kept ${realProjects.rowCount ?? 0} real user projects.`);
  for (const row of realProjects.rows.slice(0, 30)) {
    console.log(`- ${row.name} | ${row.project_language ?? "?"} | ${row.lifecycle_status ?? "?"} | ${row.username ?? "unknown owner"}`);
  }
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}
