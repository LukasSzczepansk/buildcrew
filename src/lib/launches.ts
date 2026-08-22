import type { AppLocale } from "@/lib/site-config";
import type { LaunchNeed, ShowcaseCategory, ShowcaseStatus } from "@/db/schema";

export type LaunchTab = "today" | "week" | "new" | "popular";

export const LAUNCH_CATEGORIES: readonly ShowcaseCategory[] = ["SAAS", "AI", "WEB", "MOBILE", "GAMES", "DEVTOOLS", "EDUCATION", "OTHER"];
export const LAUNCH_NEEDS: readonly LaunchNeed[] = ["FEEDBACK", "TESTERS", "TEAM", "USERS"];
export const LAUNCH_STATUSES: readonly ShowcaseStatus[] = ["MVP", "LIVE", "EXPERIMENT"];

const categoryLabels = {
  pl: { AI: "AI", WEB: "Web", MOBILE: "Mobile", GAMES: "Gra", EDUCATION: "Edukacja", SAAS: "SaaS", DEVTOOLS: "Developer Tools", OTHER: "Inne" },
  en: { AI: "AI", WEB: "Web", MOBILE: "Mobile", GAMES: "Game", EDUCATION: "Education", SAAS: "SaaS", DEVTOOLS: "Developer Tools", OTHER: "Other" },
} satisfies Record<AppLocale, Record<ShowcaseCategory, string>>;

const needLabels = {
  pl: { FEEDBACK: "Szukam feedbacku", TESTERS: "Szukam testerów", TEAM: "Szukam ludzi do zespołu", USERS: "Szukam pierwszych użytkowników" },
  en: { FEEDBACK: "Looking for feedback", TESTERS: "Looking for testers", TEAM: "Looking for teammates", USERS: "Looking for first users" },
} satisfies Record<AppLocale, Record<LaunchNeed, string>>;

const statusLabels = {
  pl: { MVP: "MVP", LIVE: "Działa online", EXPERIMENT: "Eksperyment" },
  en: { MVP: "MVP", LIVE: "Live", EXPERIMENT: "Experiment" },
} satisfies Record<AppLocale, Record<ShowcaseStatus, string>>;

export function launchCategoryLabel(value: ShowcaseCategory, locale: AppLocale) { return categoryLabels[locale][value]; }
export function launchNeedLabel(value: LaunchNeed, locale: AppLocale) { return needLabels[locale][value]; }
export function launchStatusLabel(value: ShowcaseStatus, locale: AppLocale) { return statusLabels[locale][value]; }

export function normalizeLaunchTab(value: string | null | undefined): LaunchTab {
  if (value === "week" || value === "new" || value === "popular") return value;
  return "today";
}

export function makeLaunchSlug(title: string, suffix: string) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 58) || "projekt";
  return `${base}-${suffix.replace(/-/g, "").slice(0, 6).toLowerCase()}`;
}
