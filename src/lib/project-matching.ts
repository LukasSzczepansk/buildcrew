import type { AppLocale } from "@/lib/site-config";
import { labelsFor } from "@/lib/constants-i18n";
import type { Commitment, Level, ProjectLanguage, ProjectMarketScope, RoleType, WorkModePreference } from "@/db/schema";

export type MatchableBuilderForProject = {
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  interests: string[];
  languages?: string[];
  country?: string | null;
  workModePreference?: WorkModePreference | null;
};

export type MatchableProject = {
  commitment: Commitment | null;
  interests: string[];
  technologies: string[];
  collaborationMode: "REMOTE" | "HYBRID" | "LOCAL" | null;
  projectLanguage: ProjectLanguage;
  country: string | null;
  marketScope: ProjectMarketScope;
  openRoles: Array<{
    roleType: RoleType;
    preferredLevel: Level | null;
    skills: string[];
  }>;
};

export function computeProjectMatch(builder: MatchableBuilderForProject, project: MatchableProject, locale: AppLocale = "pl") {
  const labels = labelsFor(locale);
  const en = locale === "en";
  let score = 0;
  const reasons: string[] = [];

  const roleMatches = builder.role ? project.openRoles.filter((role) => role.roleType === builder.role) : [];
  if (roleMatches.length) {
    score += 30;
    reasons.push(en ? `They are looking for ${labels.roles[builder.role!]}` : `Szukają osoby w roli: ${labels.roles[builder.role!]}`);
  }

  const roleSkillSet = new Set(project.openRoles.flatMap((role) => role.skills));
  const sharedSkills = builder.skills.filter((skill) => project.technologies.includes(skill) || roleSkillSet.has(skill));
  if (sharedSkills.length) {
    score += Math.min(25, sharedSkills.length * 7);
    reasons.push(en ? `${sharedSkills.slice(0, 3).join(", ")} matches the project stack` : `Pasujące umiejętności: ${sharedSkills.slice(0, 3).join(", ")}`);
  }

  const sharedInterests = builder.interests.filter((interest) => project.interests.includes(interest));
  if (sharedInterests.length) {
    score += Math.min(12, sharedInterests.length * 6);
    reasons.push(en ? `Shared area: ${sharedInterests[0]}` : `Wspólny obszar: ${sharedInterests[0]}`);
  }

  if (builder.weeklyHours && project.commitment && builder.weeklyHours === project.commitment) {
    score += 12;
    reasons.push(en ? `Same weekly commitment: ${labels.commitments[project.commitment]}` : `Pasująca dostępność: ${labels.commitments[project.commitment]}`);
  }

  if (builder.level && project.openRoles.some((role) => !role.preferredLevel || role.preferredLevel === builder.level)) {
    score += 8;
    reasons.push(en ? "Your experience level fits an open role" : "Twój poziom doświadczenia pasuje do otwartej roli");
  }

  const builderLanguages = new Set(builder.languages ?? []);
  const languageFits = project.projectLanguage === "MULTI"
    || (project.projectLanguage === "EN" && builderLanguages.has("English"))
    || (project.projectLanguage === "PL" && builderLanguages.has("Polish"));
  if (languageFits) {
    score += 10;
    reasons.push(en ? "You can work in the project language" : "Znasz język używany w projekcie");
  } else if (builderLanguages.size > 0) {
    score = Math.max(0, score - 15);
  }

  const remoteFriendly = project.collaborationMode === "REMOTE" || project.marketScope === "WORLDWIDE";
  if (builder.workModePreference === "REMOTE" && remoteFriendly) {
    score += 5;
    reasons.push(en ? "Remote-friendly collaboration" : "Projekt wspiera pracę zdalną");
  } else if (builder.country && project.country && builder.country === project.country) {
    score += 4;
    reasons.push(en ? `Same country: ${builder.country}` : `Ten sam kraj: ${builder.country}`);
  }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}
