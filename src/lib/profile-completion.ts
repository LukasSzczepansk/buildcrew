import type { Commitment, Level, LookingFor, RoleType } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

export type ProfileCompletionInput = {
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  headline?: string | null;
  bio?: string | null;
  country?: string | null;
  languages?: string[] | null;
  skills?: string[] | null;
  interests?: string[] | null;
  lookingFor?: LookingFor[] | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  publicProfile?: boolean | null;
};

type CompletionItem = {
  key: string;
  weight: number;
  done: boolean;
  pl: string;
  en: string;
};

export function getProfileCompletion(profile: ProfileCompletionInput, locale: AppLocale = "pl") {
  const skillsCount = profile.skills?.length ?? 0;
  const items: CompletionItem[] = [
    { key: "role", weight: 15, done: Boolean(profile.role), pl: "główna specjalizacja", en: "primary specialization" },
    { key: "skillStart", weight: 5, done: skillsCount >= 1, pl: "pierwsza umiejętność", en: "first skill" },
    { key: "skills", weight: 10, done: skillsCount >= 3, pl: "co najmniej 3 umiejętności", en: "at least 3 skills" },
    { key: "lookingFor", weight: 10, done: (profile.lookingFor?.length ?? 0) > 0, pl: "czego aktualnie szukasz", en: "what you are looking for" },
    { key: "level", weight: 10, done: Boolean(profile.level), pl: "poziom doświadczenia", en: "experience level" },
    { key: "availability", weight: 10, done: Boolean(profile.weeklyHours), pl: "dostępność tygodniową", en: "weekly availability" },
    { key: "headline", weight: 10, done: Boolean(profile.headline?.trim()), pl: "nagłówek profilu", en: "profile headline" },
    { key: "bio", weight: 10, done: Boolean(profile.bio?.trim()), pl: "krótkie bio", en: "short bio" },
    { key: "country", weight: 5, done: Boolean(profile.country?.trim()), pl: "kraj", en: "country" },
    { key: "languages", weight: 5, done: (profile.languages?.length ?? 0) > 0, pl: "język współpracy", en: "collaboration language" },
    { key: "proof", weight: 10, done: Boolean(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl), pl: "GitHub, portfolio lub LinkedIn", en: "GitHub, portfolio or LinkedIn" },
  ];

  const score = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const missing = items.filter((item) => !item.done).map((item) => locale === "en" ? item.en : item.pl);
  return {
    score,
    missing,
    complete: score === 100,
    strong: score >= 80,
  };
}
