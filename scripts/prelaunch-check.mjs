import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const required = [
  "DATABASE_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const missing = required.filter((key) => !String(process.env[key] ?? "").trim());
const warnings = [];
const errors = [];

if (missing.length) errors.push(`Missing environment variables: ${missing.join(", ")}`);

const appUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
if (appUrl && appUrl !== "https://buildcreww.com") warnings.push(`NEXT_PUBLIC_APP_URL is ${appUrl}; production should use https://buildcreww.com.`);

const emailFrom = String(process.env.EMAIL_FROM ?? "").trim();
if (emailFrom && !/@mail\.buildcreww\.com[>\s]*$/i.test(emailFrom)) {
  warnings.push("EMAIL_FROM does not use the verified mail.buildcreww.com sending domain.");
}

console.log("BuildCrew pre-launch check");
console.log(`- App URL: ${appUrl || "missing"}`);
console.log(`- Email sender configured: ${emailFrom ? "yes" : "no"}`);
console.log(`- Google OAuth configured: ${process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "yes" : "no"}`);
console.log(`- GitHub OAuth configured: ${process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? "yes" : "no"}`);

if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    try {
      const [users, projects, samples, stale, publicProfiles] = await Promise.all([
        client.query(`select count(*)::int as count from profiles where onboarding_completed = true`),
        client.query(`select count(*)::int as count from projects where entry_type = 'PROJECT' and lifecycle_status = 'ACTIVE'`),
        client.query(`select count(*)::int as count from users where lower(email) like 'sample+%@buildcrew.invalid'`),
        client.query(`select count(*)::int as count from projects where entry_type = 'PROJECT' and lifecycle_status = 'ACTIVE' and updated_at < now() - interval '30 days'`),
        client.query(`select count(*)::int as count from profiles where onboarding_completed = true and public_profile = true`),
      ]);

      const userCount = users.rows[0]?.count ?? 0;
      const projectCount = projects.rows[0]?.count ?? 0;
      const sampleCount = samples.rows[0]?.count ?? 0;
      const staleCount = stale.rows[0]?.count ?? 0;
      const publicCount = publicProfiles.rows[0]?.count ?? 0;

      console.log(`- Completed profiles: ${userCount}`);
      console.log(`- Public profiles: ${publicCount}`);
      console.log(`- Active real/project rows: ${projectCount}`);
      console.log(`- Sample accounts: ${sampleCount}`);
      console.log(`- Active projects stale >30 days: ${staleCount}`);

      if (sampleCount > 0) warnings.push(`There are still ${sampleCount} sample account(s). Run npm run launch:remove-samples before public promotion.`);
      if (staleCount > 0) warnings.push(`${staleCount} active project(s) have not been updated for more than 30 days. Review or pause them.`);
      if (projectCount === 0) warnings.push("There are no active projects in the database.");
      if (userCount > 0 && publicCount === 0) warnings.push("No completed profile is public, so the landing page may look empty.");
    } finally {
      client.release();
    }
  } catch (error) {
    errors.push(`Database check failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await pool.end();
  }
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

if (errors.length) process.exit(1);
console.log(warnings.length ? "Pre-launch check finished with warnings." : "Pre-launch check: OK");
