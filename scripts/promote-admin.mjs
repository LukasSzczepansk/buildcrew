import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Użycie: npm run admin:promote -- twoj@email.pl");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Brakuje DATABASE_URL.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && email.endsWith("@demo.local")) {
  console.error("Nie można promować konta demo na administratora w produkcji.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const result = await client.query(
    `select id, email, email_verified_at, system_role from users where lower(email)=lower($1) limit 1`,
    [email],
  );
  const user = result.rows[0];
  if (!user) throw new Error("Nie znaleziono użytkownika. Najpierw zarejestruj konto.");
  if (!user.email_verified_at) throw new Error("Najpierw potwierdź adres e-mail tego konta.");
  await client.query(`update users set system_role='ADMIN' where id=$1`, [user.id]);
  await client.query(`delete from sessions where user_id=$1`, [user.id]);
  console.log(`✅ ${user.email} ma teraz rolę ADMIN. Zaloguj się ponownie; admin 2FA będzie wymagane.`);
} catch (error) {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
