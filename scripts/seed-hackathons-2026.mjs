import crypto from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";
import { HACKATHONS_2026 } from "./data/hackathons-2026.mjs";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");

if (!connectionString) {
  console.error("Brak DATABASE_URL w .env.local / środowisku.");
  process.exit(1);
}

function databaseTarget(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "nieznana baza";
  }
}

const client = new Client({ connectionString });

async function findSeedOwner() {
  const preferredEmail = process.env.HACKATHON_SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (preferredEmail) {
    const preferred = await client.query(
      `select id, email from users where lower(email) = $1 and system_role = 'ADMIN' and is_suspended = false limit 1`,
      [preferredEmail],
    );
    if (preferred.rows[0]) return preferred.rows[0];
    throw new Error(`Nie znaleziono aktywnego ADMIN-a o emailu ${preferredEmail}.`);
  }

  const result = await client.query(
    `select id, email from users where system_role = 'ADMIN' and is_suspended = false order by created_at asc limit 1`,
  );
  if (!result.rows[0]) {
    throw new Error("Brak aktywnego konta ADMIN. Najpierw nadaj sobie rolę admina albo ustaw HACKATHON_SEED_ADMIN_EMAIL.");
  }
  return result.rows[0];
}

async function upsertHackathon(event, ownerId) {
  const id = crypto.randomUUID();
  const values = [
    id,
    event.slug,
    event.name,
    event.summary,
    event.description,
    event.organizerName,
    event.organizerUrl,
    event.officialUrl,
    event.registrationUrl,
    event.locationType,
    event.city,
    event.venue,
    event.startsAt,
    event.endsAt,
    event.registrationDeadline,
    event.minTeamSize,
    event.maxTeamSize,
    event.themes,
    ownerId,
  ];

  const result = await client.query(
    `
      insert into hackathons (
        id, slug, name, summary, description, organizer_name, organizer_url,
        official_url, registration_url, location_type, city, venue, starts_at,
        ends_at, registration_deadline, min_team_size, max_team_size, themes,
        cover_image_url, media_rights_confirmed, is_partner, is_cancelled,
        is_published, created_by, created_at, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13::timestamptz,
        $14::timestamptz, $15::timestamptz, $16, $17, $18::text[],
        null, false, false, false,
        true, $19, now(), now()
      )
      on conflict (slug) do update set
        name = excluded.name,
        summary = excluded.summary,
        description = excluded.description,
        organizer_name = excluded.organizer_name,
        organizer_url = excluded.organizer_url,
        official_url = excluded.official_url,
        registration_url = excluded.registration_url,
        location_type = excluded.location_type,
        city = excluded.city,
        venue = excluded.venue,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        registration_deadline = excluded.registration_deadline,
        min_team_size = excluded.min_team_size,
        max_team_size = excluded.max_team_size,
        themes = excluded.themes,
        is_cancelled = false,
        is_published = true,
        updated_at = now()
      returning id, slug, (xmax = 0) as inserted
    `,
    values,
  );
  return result.rows[0];
}

console.log(`Baza docelowa: ${databaseTarget(connectionString)}`);
console.log(`Seed: ${HACKATHONS_2026.length} zweryfikowanych wydarzeń (stan danych: 2026-08-15).`);

if (dryRun) {
  for (const event of HACKATHONS_2026) {
    console.log(`DRY RUN  ${event.slug.padEnd(34)} ${event.name}`);
  }
  console.log("Nie wykonano żadnych zapisów.");
  process.exit(0);
}

try {
  await client.connect();
  const owner = await findSeedOwner();
  console.log(`created_by: ${owner.email}`);

  await client.query("begin");
  let inserted = 0;
  let updated = 0;

  for (const event of HACKATHONS_2026) {
    const row = await upsertHackathon(event, owner.id);
    if (row.inserted) inserted += 1;
    else updated += 1;
    console.log(`${row.inserted ? "DODANO   " : "ZMIENIONO"}  ${event.name}`);
  }

  await client.query("commit");
  console.log(`Gotowe. Dodano: ${inserted}, zaktualizowano: ${updated}.`);
  console.log("Sprawdź /hackathony oraz /admin/hackathons.");
} catch (error) {
  try { await client.query("rollback"); } catch {}
  console.error("Seed hackathonów nie powiódł się:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
