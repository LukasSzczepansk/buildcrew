import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  {
    file: "src/lib/site-config.ts",
    patterns: [
      /APP_LOCALES[^\n]*\["pl",\s*"en"\]/,
      /DEFAULT_LOCALE[^\n]*"pl"/,
    ],
    message: "site-config must enable PL + EN and default to PL",
  },
  {
    file: "src/components/i18n/language-switcher.tsx",
    patterns: [/\["pl",\s*"en"\]/, /buildcrew-locale/, /\/api\/locale/],
    message: "language switcher must expose PL/EN and persist the selection",
  },
  {
    file: "src/components/i18n/locale-provider.tsx",
    patterns: [/createContext<AppLocale>/, /locale === "en"/],
    message: "locale provider must select Polish/English copy dynamically",
  },
  {
    file: "src/app/page.tsx",
    patterns: [/LanguageSwitcher/, /getRequestLocale/, /landing_view/],
    message: "landing page must use the request locale, show the switcher and track locale-aware landing views",
  },
  {
    file: "src/lib/profile-completion.ts",
    patterns: [/Kompletność|nagłówek profilu/, /profile headline/, /score/],
    message: "profile completeness must have Polish and English copy",
  },
  {
    file: "src/lib/email.ts",
    patterns: [/EMAIL_FROM/, /emailHtmlToText/, /text:/],
    message: "transactional email must require an explicit sender and include plain text",
  },
  {
    file: "src/lib/activity.ts",
    patterns: [/Aktywny dzisiaj/, /Active today/],
    message: "activity labels must be localized",
  },
];

const errors = [];
for (const check of checks) {
  const filePath = path.join(root, check.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`${check.file}: missing`);
    continue;
  }
  const source = fs.readFileSync(filePath, "utf8");
  for (const pattern of check.patterns) {
    if (!pattern.test(source)) {
      errors.push(`${check.file}: ${check.message}`);
      break;
    }
  }
}

const forbidden = [
  {
    file: "src/server/data/projects.ts",
    pattern: /eq\(projects\.projectLanguage,\s*"EN"\)/,
    message: "project discovery must not hide Polish or multilingual projects",
  },
  {
    file: "src/server/data/social-projects.ts",
    pattern: /eq\(projects\.projectLanguage,\s*"EN"\)/,
    message: "feed and project history must not hide Polish or multilingual projects",
  },
  {
    file: "src/server/services/notifications.ts",
    pattern: /const locale = "en" as const/,
    message: "notification emails must use the recipient language",
  },
  {
    file: "src/server/services/retention-emails.ts",
    pattern: /const locale: AppLocale = "en"/,
    message: "retention emails must use the recipient language",
  },
  {
    file: "src/lib/project-freshness.ts",
    pattern: /:\s*"No activity data"/,
    message: "Polish project freshness copy must be translated",
  },
  {
    file: "src/lib/utils.ts",
    pattern: /locale === "en" \? "just now" : "just now"/,
    message: "Polish relative time copy must be translated",
  },
  {
    file: "src/app/u/[username]/page.tsx",
    pattern: /:\s*"Contributor"/,
    message: "public profile must not show English contributor copy in Polish UI",
  },
  {
    file: "src/app/(app)/projects/[id]/page.tsx",
    pattern: /<SideSection title=\{\"Links\"\}>/,
    message: "project details links heading must be localized",
  },
  {
    file: "src/server/actions/auth.ts",
    pattern: /return \{ error: "(Invalid code|The code expired|The verification session expired|Too many attempts\.)/,
    message: "core auth errors must use localized copy",
  },
];

for (const check of forbidden) {
  const filePath = path.join(root, check.file);
  if (!fs.existsSync(filePath)) continue;
  const source = fs.readFileSync(filePath, "utf8");
  if (check.pattern.test(source)) errors.push(`${check.file}: ${check.message}`);
}

if (errors.length) {
  console.error("Bilingual UI check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Bilingual UI check: OK");
