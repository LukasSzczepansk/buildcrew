import { LEVEL_ORDER } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import type { Commitment, Goal, Level, RoleType, WorkModePreference } from "@/db/schema";

export type MatchableProfile = {
  userId: string;
  username: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  interests: string[];
  goals: Goal[];
  languages?: string[];
  workModePreference?: WorkModePreference | null;
  country?: string | null;
};

const COMPLEMENTARY_PAIRS: [RoleType, RoleType][] = [
  ["FRONTEND", "BACKEND"],
  ["FRONTEND", "UI_UX"],
  ["BACKEND", "UI_UX"],
  ["PRODUCT", "FRONTEND"],
  ["PRODUCT", "BACKEND"],
  ["PRODUCT", "FULLSTACK"],
  ["PRODUCT", "UI_UX"],
  ["UI_UX", "MOBILE"],
  ["FRONTEND", "MOBILE"],
  ["AI_ML", "BACKEND"],
  ["AI_ML", "FRONTEND"],
  ["MARKETING", "PRODUCT"],
  ["MARKETING", "FRONTEND"],
];

function rolesComplementary(a: RoleType | null, b: RoleType | null) {
  if (!a || !b || a === b) return false;
  return COMPLEMENTARY_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export type MatchResult = {
  score: number;
  reasons: string[];
};

export function computeMatch(me: MatchableProfile, other: MatchableProfile, locale: AppLocale = "pl"): MatchResult {
  const labels = labelsFor(locale);
  const en = locale === "en";
  let score = 0;
  const reasons: string[] = [];

  if (rolesComplementary(me.role, other.role)) {
    score += 25;
    reasons.push(
      en
        ? `${other.role ? labels.roles[other.role] : "Their role"} complements yours (${me.role ? labels.roles[me.role] : "not set"})`
        : `${other.role ? labels.roles[other.role] : "Ich rola"} uzupełnia Twoją (${me.role ? labels.roles[me.role] : "brak"})`,
    );
  } else if (me.role && other.role && me.role === other.role) {
    reasons.push(en ? `You are both ${labels.roles[me.role]} - you can support each other` : `Oboje jesteście ${labels.roles[me.role]} - możecie się wspierać`);
    score += 8;
  }

  const sharedInterests = me.interests.filter((i) => other.interests.includes(i));
  if (sharedInterests.length > 0) {
    const interestScore = Math.min(20, sharedInterests.length * 8);
    score += interestScore;
    reasons.push(en ? `You’re both interested in ${sharedInterests.slice(0, 2).join(", ")}` : `Oboje interesujecie się ${sharedInterests.slice(0, 2).join(", ")}`);
  }

  if (me.weeklyHours && other.weeklyHours && me.weeklyHours === other.weeklyHours) {
    score += 12;
    reasons.push(en ? `You both have ${labels.commitments[other.weeklyHours]}` : `Oboje macie ${labels.commitments[other.weeklyHours]}`);
  }

  const sharedGoals = me.goals.filter((g) => other.goals.includes(g));
  if (sharedGoals.length > 0) {
    score += 12;
    reasons.push(en ? `Similar goal: ${labels.goals[sharedGoals[0]].toLowerCase()}` : `Podobny cel: ${labels.goals[sharedGoals[0]].toLowerCase()}`);
  }

  if (me.level && other.level) {
    const diff = Math.abs(LEVEL_ORDER[me.level] - LEVEL_ORDER[other.level]);
    if (diff <= 1) {
      score += 10;
      reasons.push(en ? "Similar experience level" : "Podobny poziom doświadczenia");
    }
  }

  const sharedLanguages = (me.languages ?? []).filter((language) => (other.languages ?? []).includes(language));
  if (sharedLanguages.length > 0) {
    score += 12;
    reasons.push(en ? `You can collaborate in ${sharedLanguages.slice(0, 2).join(" / ")}` : `Możecie współpracować po: ${sharedLanguages.slice(0, 2).join(" / ")}`);
  } else if ((me.languages?.length ?? 0) > 0 && (other.languages?.length ?? 0) > 0) {
    score = Math.max(0, score - 12);
  }

  if (me.workModePreference && other.workModePreference) {
    const compatible = me.workModePreference === "FLEXIBLE" || other.workModePreference === "FLEXIBLE" || me.workModePreference === other.workModePreference;
    if (compatible) {
      score += 6;
      reasons.push(en ? "Compatible work-mode preference" : "Pasujący tryb współpracy");
    }
  }

  if (me.country && other.country && me.country === other.country) {
    score += 3;
    reasons.push(en ? `Same country: ${me.country}` : `Ten sam kraj: ${me.country}`);
  }

  return { score: Math.min(100, score), reasons };
}
