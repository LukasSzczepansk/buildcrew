import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (typeof process.env.DATABASE_URL !== "string" || !process.env.DATABASE_URL.trim()) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running this script.");
}
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("begin");
  const owners = await client.query(`update project_members set collaboration_status='CONFIRMED', member_confirmed_at=coalesce(member_confirmed_at,joined_at), owner_confirmed_at=coalesce(owner_confirmed_at,joined_at) where is_owner=true`);
  const completed = await client.query(`update project_members pm set collaboration_status='CONFIRMED', member_confirmed_at=coalesce(pm.member_confirmed_at,pm.joined_at), owner_confirmed_at=coalesce(pm.owner_confirmed_at,pm.joined_at) from projects p where p.id=pm.project_id and p.lifecycle_status='COMPLETED' and pm.is_owner=false`);
  await client.query("commit");
  console.log(`Prepared collaboration history: ${owners.rowCount ?? 0} owner memberships and ${completed.rowCount ?? 0} completed-project memberships confirmed.`);
  console.log("Active non-owner memberships remain pending until both people confirm that work actually started.");
} catch (e) { await client.query("rollback"); throw e; } finally { client.release(); await pool.end(); }
