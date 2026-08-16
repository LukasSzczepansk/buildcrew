import type { HackathonAvailability, HackathonGoal, Level, RoleType } from "@/db/schema";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";

type MatchPerson = {
  role: RoleType;
  technologies: string[];
  themes: string[];
  goal: HackathonGoal;
  availability: HackathonAvailability;
  preferredTeamSize: number;
  level?: Level | null;
};

function overlap(a: string[], b: string[]) {
  const right = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => right.has(item.toLowerCase()));
}

const ROLE_FAMILIES: Record<RoleType, string> = {
  FRONTEND: "engineering",
  BACKEND: "engineering",
  FULLSTACK: "engineering",
  MOBILE: "engineering",
  AI_ML: "data",
  UI_UX: "design",
  PRODUCT: "product",
  MARKETING: "growth",
};

export function computeHackathonMatch(me: MatchPerson, candidate: MatchPerson, locale: AppLocale = "pl") {
  const roleLabels = labelsFor(locale).roles;
  const copy = (pl: string, en: string) => locale === "en" ? en : pl;
  let score = 18;
  const reasons: string[] = [];

  if (me.role !== candidate.role) {
    const differentFamily = ROLE_FAMILIES[me.role] !== ROLE_FAMILIES[candidate.role];
    score += differentFamily ? 24 : 15;
    reasons.push(copy(`${roleLabels[candidate.role]} uzupełnia Twoją rolę ${roleLabels[me.role]}.`, `${roleLabels[candidate.role]} complements your ${roleLabels[me.role]} role.`));
  } else {
    score += 4;
  }

  const sharedThemes = overlap(me.themes, candidate.themes);
  if (sharedThemes.length) {
    score += Math.min(20, sharedThemes.length * 8);
    reasons.push(copy(`Wspólne kierunki: ${sharedThemes.slice(0, 2).join(" · ")}.`, `Shared themes: ${sharedThemes.slice(0, 2).join(" · ")}.`));
  }

  const sharedTech = overlap(me.technologies, candidate.technologies);
  if (sharedTech.length) {
    score += Math.min(12, sharedTech.length * 4);
    reasons.push(copy(`Znacie wspólny stack: ${sharedTech.slice(0, 2).join(" · ")}.`, `Shared stack: ${sharedTech.slice(0, 2).join(" · ")}.`));
  }

  if (me.goal === candidate.goal) {
    score += 12;
    reasons.push(copy("Macie podobne podejście do hackathonu.", "You have a similar approach to the hackathon."));
  }

  if (me.availability === candidate.availability) {
    score += 10;
    reasons.push(copy("Deklarujecie podobną dostępność podczas wydarzenia.", "You have similar availability during the event."));
  } else if (me.availability !== "LIMITED" && candidate.availability !== "LIMITED") {
    score += 5;
  }

  const teamSizeDiff = Math.abs(me.preferredTeamSize - candidate.preferredTeamSize);
  if (teamSizeDiff === 0) score += 8;
  else if (teamSizeDiff === 1) score += 4;

  if (me.level && candidate.level && me.level === candidate.level) score += 4;

  return { score: Math.min(99, score), reasons: reasons.slice(0, 4) };
}

/**
 * Builds a small team suggestion without pretending there is a magical AI score.
 * The base match score still matters, but candidates get an extra preference
 * when they add a role/family not represented in the proposed squad yet.
 */
export function selectComplementaryHackathonMatches<T extends { role: RoleType; score: number }>(
  matches: T[],
  currentRole: RoleType,
  slots: number,
) {
  const selected: T[] = [];
  const remaining = [...matches];
  const usedRoles = new Set<RoleType>([currentRole]);
  const usedFamilies = new Set<string>([ROLE_FAMILIES[currentRole]]);

  while (selected.length < slots && remaining.length) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]!;
      const family = ROLE_FAMILIES[candidate.role];
      const diversityBonus = (usedFamilies.has(family) ? 0 : 14) + (usedRoles.has(candidate.role) ? 0 : 6);
      const value = candidate.score + diversityBonus;
      if (value > bestValue) { bestValue = value; bestIndex = index; }
    }
    const [chosen] = remaining.splice(bestIndex, 1);
    if (!chosen) break;
    selected.push(chosen);
    usedRoles.add(chosen.role);
    usedFamilies.add(ROLE_FAMILIES[chosen.role]);
  }

  return selected;
}
