import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const strict = process.env.SECURITY_CHECK_PRODUCTION === "true" || process.env.NODE_ENV === "production";
const errors = [];
const warnings = [];

function required(name) {
  if (!process.env[name]?.trim()) errors.push(`Brakuje ${name}`);
}

required("DATABASE_URL");
if (strict) {
  required("NEXT_PUBLIC_APP_URL");
  required("RESEND_API_KEY");
  required("EMAIL_FROM");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl && !appUrl.startsWith("https://")) errors.push("NEXT_PUBLIC_APP_URL w produkcji musi zaczynać się od https://");
  if ((process.env.ADMIN_EMAILS || "").includes("admin@buildcrew.local")) errors.push("Usuń demo admin@buildcrew.local z ADMIN_EMAILS przed produkcją.");
  if (process.env.ALLOW_ADMIN_EMAIL_BOOTSTRAP === "true") errors.push("ALLOW_ADMIN_EMAIL_BOOTSTRAP musi być false w produkcji po nadaniu roli ADMIN w bazie.");
  if (process.env.ALLOW_DEMO_SEED === "true") errors.push("ALLOW_DEMO_SEED nie może być true w produkcji.");
} else {
  if (!process.env.RESEND_API_KEY) warnings.push("RESEND_API_KEY brak: w development linki/kody e-mail będą wypisywane w terminalu.");
}

if (process.env.DATABASE_URL?.includes("postgres:postgres@") && strict) errors.push("DATABASE_URL wygląda na domyślne hasło postgres:postgres.");

for (const w of warnings) console.warn(`⚠️ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  process.exit(1);
}
console.log(strict ? "✅ Konfiguracja przeszła production security check." : "✅ Podstawowa konfiguracja wygląda poprawnie.");
