import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const results = [];
  results.push((await client.query(`delete from sessions where expires_at < now()`)).rowCount || 0);
  results.push((await client.query(`delete from email_verification_tokens where expires_at < now()`)).rowCount || 0);
  results.push((await client.query(`delete from password_reset_tokens where expires_at < now()`)).rowCount || 0);
  results.push((await client.query(`delete from admin_login_challenges where expires_at < now()`)).rowCount || 0);
  results.push((await client.query(`delete from rate_limit_buckets where window_start < now() - interval '7 days'`)).rowCount || 0);
  results.push((await client.query(`update profile_avatars set status = 'REMOVED', image_base64 = null, moderated_at = now(), rejection_reason = 'Zgłoszenie wygasło po 30 dniach bez decyzji.' where status = 'PENDING' and uploaded_at < now() - interval '30 days'`)).rowCount || 0);
  results.push((await client.query(`delete from profile_avatars where status in ('REJECTED', 'REMOVED') and coalesce(moderated_at, uploaded_at) < now() - interval '12 months'`)).rowCount || 0);
  console.log(`🧹 Maintenance OK. Usunięto ${results.reduce((a,b)=>a+b,0)} starych rekordów.`);
} finally {
  await client.end();
}
