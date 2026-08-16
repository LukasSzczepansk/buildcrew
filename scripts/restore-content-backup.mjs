import fs from "node:fs/promises";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env", override: false });

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: node scripts/restore-content-backup.mjs backups/english-content-....json");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const backup = JSON.parse(await fs.readFile(backupPath, "utf8"));

const PK = {
  profiles: ["user_id"], projects: ["id"], project_roles: ["id"], project_updates: ["id"], project_workspaces: ["project_id"],
  project_workspace_tasks: ["id"], project_workspace_links: ["id"], build_pool_listings: ["id"], collaboration_endorsements: ["id"],
  questions: ["id"], question_tags: ["id"], answers: ["id"], hackathons: ["id"], hackathon_participants: ["hackathon_id", "user_id"],
  hackathon_teams: ["id"], build_challenges: ["id"], showcase_entries: ["id"], showcase_feedback: ["id"], notifications: ["id"], profile_avatars: ["id"],
};

try {
  await pool.query("begin");
  for (const [table, rows] of Object.entries(backup.tables ?? {})) {
    if (table.startsWith("__")) continue;
    const pk = PK[table];
    if (!pk || !Array.isArray(rows)) continue;
    for (const row of rows) {
      const columns = Object.keys(row).filter((column) => !pk.includes(column));
      if (!columns.length) continue;
      const setClause = columns.map((column, index) => `"${column}" = $${index + 1}`).join(", ");
      const whereClause = pk.map((column, index) => `"${column}" = $${columns.length + index + 1}`).join(" and ");
      await pool.query(`update "${table}" set ${setClause} where ${whereClause}`, [...columns.map((column) => row[column]), ...pk.map((column) => row[column])]);
    }
  }
  for (const row of backup.tables?.__profile_languages ?? []) {
    await pool.query('update "profiles" set "languages" = $1 where "user_id" = $2', [row.languages, row.user_id]);
  }
  for (const row of backup.tables?.__user_locales ?? []) {
    await pool.query('update "users" set "preferred_locale" = $1 where "id" = $2', [row.preferred_locale, row.id]);
  }
  for (const row of backup.tables?.__project_languages ?? []) {
    await pool.query('update "projects" set "project_language" = $1 where "id" = $2', [row.project_language, row.id]);
  }
  await pool.query("alter table users alter column preferred_locale set default 'en'");
  await pool.query("alter table projects alter column project_language set default 'EN'");
  await pool.query("commit");
  console.log(`Restored content from ${backupPath}`);
} catch (error) {
  try { await pool.query("rollback"); } catch {}
  console.error("Restore failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
