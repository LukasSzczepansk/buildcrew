import { LEVEL_ORDER } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import type { Commitment, Goal, Level, LookingFor, RoleType, WorkModePreference } from "@/db/schema";

export type MatchableProfile = {
  userId: string;
  username: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  interests: string[];
  goals: Goal[];
  skills?: string[];
  lookingFor?: LookingFor[];
  languages?: string[];
  workModePreference?: WorkModePreference | null;
  country?: string | null;
  lastActiveAt?: Date | string | null;
};

const COMPLEMENTARY_PAIRS: [RoleType, RoleType][] = [
  ["FRONTEND", "BACKEND"], ["FRONTEND", "UI_UX"], ["BACKEND", "UI_UX"],
  ["PRODUCT", "FRONTEND"], ["PRODUCT", "BACKEND"], ["PRODUCT", "FULLSTACK"], ["PRODUCT", "UI_UX"],
  ["UI_UX", "MOBILE"], ["FRONTEND", "MOBILE"], ["AI_ML", "BACKEND"], ["AI_ML", "FRONTEND"],
  ["MARKETING", "PRODUCT"], ["MARKETING", "FRONTEND"],
];

function rolesComplementary(a: RoleType | null, b: RoleType | null) {
  if (!a || !b || a === b) return false;
  return COMPLEMENTARY_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function intentCompatibility(a: LookingFor[] = [], b: LookingFor[] = []) {
  const aHasProject = a.includes("HAS_PROJECT");
  const bHasProject = b.includes("HAS_PROJECT");
  const aWantsBuild = a.some((item) => item === "WANTS_PROJECT" || item === "OPEN_TO_BUILD" || item === "COFOUNDER");
  const bWantsBuild = b.some((item) => item === "WANTS_PROJECT" || item === "OPEN_TO_BUILD" || item === "COFOUNDER");
  if ((aHasProject && bWantsBuild) || (bHasProject && aWantsBuild)) return "project" as const;
  if (a.includes("COFOUNDER") && b.includes("COFOUNDER")) return "cofounder" as const;
  if (a.includes("NETWORKING") && b.includes("NETWORKING")) return "network" as const;
  if (aWantsBuild && bWantsBuild) return "build" as const;
  return null;
}

export type MatchResult = { score: number; reasons: string[] };

export function computeMatch(me: MatchableProfile, other: MatchableProfile, locale: AppLocale = "pl"): MatchResult {
  const labels = labelsFor(locale);
  const en = locale === "en";
  let score = 0;
  const reasons: string[] = [];

  if (rolesComplementary(me.role, other.role)) {
    score += 22;
    reasons.push(en
      ? `${other.role ? labels.roles[other.role] : "Their role"} complements your ${me.role ? labels.roles[me.role] : "profile"}`
      : `${other.role ? labels.roles[other.role] : "Ta rola"} uzupełnia Twój profil${me.role ? ` (${labels.roles[me.role]})` : ""}`);
  } else if (me.role && other.role && me.role === other.role) {
    score += 8;
    reasons.push(en ? `You both work as ${labels.roles[me.role]}` : `Oboje działacie jako ${labels.roles[me.role]}`);
  }

  const sharedSkills = (me.skills ?? []).filter((skill) => (other.skills ?? []).includes(skill));
  if (sharedSkills.length) {
    score += Math.min(18, sharedSkills.length * 6);
    reasons.push(en ? `${sharedSkills.slice(0, 3).join(", ")} in common` : `Wspólne umiejętności: ${sharedSkills.slice(0, 3).join(", ")}`);
  }

  const sharedInterests = me.interests.filter((interest) => other.interests.includes(interest));
  if (sharedInterests.length) {
    score += Math.min(14, sharedInterests.length * 7);
    reasons.push(en ? `Shared interest: ${sharedInterests.slice(0, 2).join(" / ")}` : `Wspólny obszar: ${sharedInterests.slice(0, 2).join(" / ")}`);
  }

  if (me.weeklyHours && other.weeklyHours && me.weeklyHours === other.weeklyHours) {
    score += 10;
    reasons.push(en ? `Same availability: ${labels.commitments[other.weeklyHours]}` : `Podobna dostępność: ${labels.commitments[other.weeklyHours]}`);
  }

  const sharedGoals = me.goals.filter((goal) => other.goals.includes(goal));
  if (sharedGoals.length) {
    score += 8;
    reasons.push(en ? `Similar goal: ${labels.goals[sharedGoals[0]].toLowerCase()}` : `Podobny cel: ${labels.goals[sharedGoals[0]].toLowerCase()}`);
  }

  if (me.level && other.level) {
    const diff = Math.abs(LEVEL_ORDER[me.level] - LEVEL_ORDER[other.level]);
    if (diff <= 1) {
      score += 7;
      reasons.push(en ? "Compatible experience level" : "Zbliżony poziom doświadczenia");
    }
  }

  const sharedLanguages = (me.languages ?? []).filter((language) => (other.languages ?? []).includes(language));
  if (sharedLanguages.length) {
    score += 10;
    reasons.push(en ? `You can work in ${sharedLanguages.slice(0, 2).join(" / ")}` : `Możecie pracować w języku: ${sharedLanguages.slice(0, 2).join(" / ")}`);
  } else if ((me.languages?.length ?? 0) > 0 && (other.languages?.length ?? 0) > 0) {
    score = Math.max(0, score - 12);
  }

  if (me.workModePreference && other.workModePreference) {
    const compatible = me.workModePreference === "FLEXIBLE" || other.workModePreference === "FLEXIBLE" || me.workModePreference === other.workModePreference;
    if (compatible) {
      score += 5;
      reasons.push(en ? "Compatible work setup" : "Pasujący tryb współpracy");
    }
  }

  if (me.country && other.country && me.country === other.country) {
    score += 3;
    reasons.push(en ? `Same country: ${me.country}` : `Ten sam kraj: ${me.country}`);
  }

  const intent = intentCompatibility(me.lookingFor, other.lookingFor);
  if (intent) {
    score += intent === "project" ? 12 : 7;
    reasons.push(intent === "project"
      ? (en ? "One of you has a project and the other is open to joining" : "Jedna osoba ma projekt, a druga jest otwarta na dołączenie")
      : intent === "cofounder"
        ? (en ? "You are both open to a co-founder conversation" : "Oboje jesteście otwarci na rozmowę o co-founderze")
        : intent === "network"
          ? (en ? "You are both open to professional networking" : "Oboje jesteście otwarci na networking")
          : (en ? "You are both open to building something new" : "Oboje jesteście otwarci na zbudowanie czegoś nowego"));
  }

  if (other.lastActiveAt) {
    const timestamp = new Date(other.lastActiveAt).getTime();
    if (Number.isFinite(timestamp) && Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000) {
      score += 4;
      reasons.push(en ? "Active this week" : "Aktywny w tym tygodniu");
    }
  }

  return { score: Math.min(100, Math.max(0, score)), reasons: reasons.slice(0, 5) };
}
