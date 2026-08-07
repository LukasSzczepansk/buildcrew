import { LEVEL_ORDER, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export type MatchableProfile = {
  userId: string;
  username: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  interests: string[];
  goals: Goal[];
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

export function computeMatch(me: MatchableProfile, other: MatchableProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (rolesComplementary(me.role, other.role)) {
    score += 30;
    reasons.push(
      `${other.role ? ROLE_LABELS[other.role] : "Ich rola"} uzupełnia Twoją (${me.role ? ROLE_LABELS[me.role] : "brak"})`,
    );
  } else if (me.role && other.role && me.role === other.role) {
    reasons.push(`Oboje jesteście ${ROLE_LABELS[me.role]} — możecie się wspierać`);
    score += 8;
  }

  const sharedInterests = me.interests.filter((i) => other.interests.includes(i));
  if (sharedInterests.length > 0) {
    const interestScore = Math.min(25, sharedInterests.length * 10);
    score += interestScore;
    reasons.push(`Oboje interesujecie się ${sharedInterests.slice(0, 2).join(", ")}`);
  }

  if (me.weeklyHours && other.weeklyHours && me.weeklyHours === other.weeklyHours) {
    score += 15;
    reasons.push(`Oboje macie ${other.weeklyHours}h tygodniowo`);
  }

  const sharedGoals = me.goals.filter((g) => other.goals.includes(g));
  if (sharedGoals.length > 0) {
    score += 15;
    reasons.push(`Podobny cel: ${sharedGoals[0].toLowerCase()}`);
  }

  if (me.level && other.level) {
    const diff = Math.abs(LEVEL_ORDER[me.level] - LEVEL_ORDER[other.level]);
    if (diff <= 1) {
      score += 15;
      reasons.push("Podobny poziom doświadczenia");
    }
  }

  return { score, reasons };
}
