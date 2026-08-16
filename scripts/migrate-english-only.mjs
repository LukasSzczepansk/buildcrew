import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env", override: false });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local or the environment before running this migration.");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query("begin");
  await pool.query("alter table users alter column preferred_locale set default 'en'");
  const usersResult = await pool.query("update users set preferred_locale = 'en' where preferred_locale is distinct from 'en'");
  await pool.query("alter table projects alter column project_language set default 'EN'");
  await pool.query("commit");

  const legacy = await pool.query(`
    select p.id, p.name, p.project_language, p.created_at, pr.username
    from projects p
    left join profiles pr on pr.user_id = p.owner_id
    where p.entry_type = 'PROJECT' and p.project_language <> 'EN'
    order by p.created_at asc
  `);

  console.log(`English-only migration complete. Updated ${usersResult.rowCount ?? 0} user locale preference(s) to EN.`);
  console.log("Database defaults are now English for new users and new projects.");

  if (!legacy.rows.length) {
    console.log("No legacy non-English projects need translation.");
  } else {
    console.log(`\n${legacy.rows.length} legacy project(s) are intentionally still hidden from global discovery until their owners translate them:`);
    for (const row of legacy.rows) {
      console.log(`- ${row.name} (${row.id})${row.username ? ` - owner: ${row.username}` : ""}`);
    }
    console.log("\nOpen My Projects -> Manage -> Public project content for each project and save the English version. Do not change project_language directly in the database.");
  }
} catch (error) {
  try { await pool.query("rollback"); } catch {}
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
