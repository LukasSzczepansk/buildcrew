import type { AppLocale } from "@/lib/site-config";
import type { Commitment, Level, LookingFor, RoleType } from "@/db/schema";

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
  const items: CompletionItem[] = [
    { key: "basics", weight: 15, done: Boolean(profile.role && profile.level && profile.weeklyHours), pl: "rola, poziom i dostępność", en: "role, level and availability" },
    { key: "headline", weight: 10, done: Boolean(profile.headline?.trim()), pl: "nagłówek profilu", en: "profile headline" },
    { key: "bio", weight: 10, done: Boolean(profile.bio?.trim()), pl: "krótkie bio", en: "short bio" },
    { key: "country", weight: 10, done: Boolean(profile.country?.trim()), pl: "kraj", en: "country" },
    { key: "languages", weight: 10, done: (profile.languages?.length ?? 0) > 0, pl: "języki współpracy", en: "collaboration languages" },
    { key: "skills", weight: 15, done: (profile.skills?.length ?? 0) >= 3, pl: "co najmniej 3 umiejętności", en: "at least 3 skills" },
    { key: "interests", weight: 10, done: (profile.interests?.length ?? 0) >= 2, pl: "co najmniej 2 obszary zainteresowań", en: "at least 2 interest areas" },
    { key: "lookingFor", weight: 10, done: (profile.lookingFor?.length ?? 0) > 0, pl: "czego aktualnie szukasz", en: "what you are currently open to" },
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
