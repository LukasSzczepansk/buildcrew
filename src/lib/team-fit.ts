import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import type { Commitment, Level, ProjectLanguage, ProjectMarketScope, RoleType, WorkModePreference } from "@/db/schema";

/**
 * Team-aware fit: scores a candidate against the *gaps* of a specific team instead of comparing two people.
 * It answers "what does this person add to this team for this role?", not just "do they look similar to me?".
 */

export type FitCandidate = {
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  languages: string[];
  country: string | null;
  workModePreference: WorkModePreference | null;
};

export type FitRole = { roleType: RoleType; preferredLevel: Level | null; skills: string[] };

export type FitTeamMember = { role: RoleType | null; level: Level | null; skills: string[] };

export type FitProject = {
  commitment: Commitment | null;
  technologies: string[];
  projectLanguage: ProjectLanguage;
  country: string | null;
  collaborationMode: "REMOTE" | "HYBRID" | "LOCAL" | null;
  marketScope: ProjectMarketScope;
  /** Every role of the project with its slots and how many are already filled. */
  roles: { id: string; slots: number; filled: number }[];
};

export type TeamFit = {
  score: number;
  /** Positive, specific reasons, strongest first (max 4). */
  reasons: string[];
  /** Things the owner should double-check. */
  cautions: string[];
  /** Team completeness before and after accepting this person (filled / total slots). */
  completeness: { filled: number; total: number; afterFilled: number };
  /** Relevant skills this person adds that nobody on the team has yet. */
  newSkills: string[];
};

const COMMITMENT_ORDER: Commitment[] = ["1-2", "3-5", "5-10", "10+"];
const LEVEL_ORDER: Level[] = ["LEARNING", "BUILDING", "EXPERIENCED"];
const FULLSTACK_COVERS: RoleType[] = ["FRONTEND", "BACKEND", "FULLSTACK"];

export function computeTeamFit(
  candidate: FitCandidate,
  role: FitRole,
  roleId: string,
  team: FitTeamMember[],
  project: FitProject,
  locale: AppLocale = "pl",
): TeamFit {
  const en = locale === "en";
  const labels = labelsFor(locale);
  const reasons: { points: number; text: string }[] = [];
  const cautions: string[] = [];

  // 1) Does the person's own role match the role they applied for? (0-30)
  let roleScore = 6;
  if (candidate.role === role.roleType) {
    roleScore = 30;
    reasons.push({ points: 30, text: en ? `Works as ${labels.roles[role.roleType]}, exactly the role you need` : `Pracuje jako ${labels.roles[role.roleType]}, dokładnie tej roli szukasz` });
  } else if (candidate.role === "FULLSTACK" && FULLSTACK_COVERS.includes(role.roleType)) {
    roleScore = 24;
    reasons.push({ points: 24, text: en ? `Full-stack profile can cover ${labels.roles[role.roleType]}` : `Profil full-stack może pokryć rolę: ${labels.roles[role.roleType]}` });
  } else if (candidate.role) {
    cautions.push(en ? `Their main role is ${labels.roles[candidate.role]}, not ${labels.roles[role.roleType]}` : `Główna rola kandydata to ${labels.roles[candidate.role]}, a nie ${labels.roles[role.roleType]}`);
  }

  // 2) Coverage of the skills this role (or, failing that, the project) needs. (0-25)
  const required = role.skills.length ? role.skills : project.technologies;
  const covered = required.filter((skill) => candidate.skills.includes(skill));
  let skillScore = 0;
  if (required.length) {
    skillScore = Math.round((covered.length / required.length) * 25);
    if (covered.length) reasons.push({ points: skillScore, text: en ? `Knows ${covered.slice(0, 3).join(", ")} (${covered.length} of ${required.length} required)` : `Zna ${covered.slice(0, 3).join(", ")} (${covered.length} z ${required.length} wymaganych)` });
    else cautions.push(en ? "None of the required skills are listed on the profile" : "Na profilu nie ma żadnej z wymaganych umiejętności");
  }

  // 3) What is new for the team: missing role and skills nobody else has. (0-15)
  const teamSkills = new Set(team.flatMap((member) => member.skills));
  const relevant = new Set([...required, ...project.technologies]);
  const newSkills = candidate.skills.filter((skill) => relevant.has(skill) && !teamSkills.has(skill));
  let gapScore = Math.min(10, newSkills.length * 5);
  if (newSkills.length) reasons.push({ points: gapScore, text: en ? `Adds ${newSkills.slice(0, 3).join(", ")}, which nobody on the team has yet` : `Wnosi ${newSkills.slice(0, 3).join(", ")}, czego nikt w zespole jeszcze nie ma` });
  const teamHasRole = team.some((member) => member.role === role.roleType);
  if (!teamHasRole) {
    gapScore = Math.min(15, gapScore + 5);
    reasons.push({ points: 5, text: en ? `The team has no ${labels.roles[role.roleType]} yet` : `W zespole nie ma jeszcze osoby w roli ${labels.roles[role.roleType]}` });
  }

  // 4) Availability versus what the project expects. (0-12)
  let availabilityScore = 0;
  if (candidate.weeklyHours && project.commitment) {
    const diff = COMMITMENT_ORDER.indexOf(candidate.weeklyHours) - COMMITMENT_ORDER.indexOf(project.commitment);
    if (diff === 0) {
      availabilityScore = 12;
      reasons.push({ points: 12, text: en ? `Same weekly availability: ${labels.commitments[project.commitment]}` : `Taka sama dostępność tygodniowa: ${labels.commitments[project.commitment]}` });
    } else if (Math.abs(diff) === 1) {
      availabilityScore = diff > 0 ? 12 : 6;
      if (diff > 0) reasons.push({ points: 10, text: en ? "Can give more time than the project expects" : "Może poświęcić więcej czasu, niż zakłada projekt" });
    } else if (diff <= -2) {
      cautions.push(en ? `Offers ${labels.commitments[candidate.weeklyHours]} h/week, the project expects ${labels.commitments[project.commitment]}` : `Deklaruje ${labels.commitments[candidate.weeklyHours]} godz./tydzień, projekt zakłada ${labels.commitments[project.commitment]}`);
    }
  }

  // 5) Level: fits the preferred level, or balances an inexperienced team. (0-8)
  let levelScore = 0;
  if (candidate.level) {
    if (role.preferredLevel) {
      if (candidate.level === role.preferredLevel) {
        levelScore = 8;
        reasons.push({ points: 8, text: en ? "Experience level matches the role" : "Poziom doświadczenia pasuje do roli" });
      } else {
        const gap = LEVEL_ORDER.indexOf(role.preferredLevel) - LEVEL_ORDER.indexOf(candidate.level);
        if (gap > 0) cautions.push(en ? "Less experienced than the role asks for" : "Mniej doświadczony(-a), niż wymaga rola");
        else levelScore = 4;
      }
    } else {
      const teamHasSenior = team.some((member) => member.level === "EXPERIENCED");
      if (candidate.level === "EXPERIENCED" && !teamHasSenior) {
        levelScore = 8;
        reasons.push({ points: 8, text: en ? "Brings senior experience the team lacks" : "Wnosi doświadczenie, którego brakuje w zespole" });
      } else levelScore = 4;
    }
  }

  // 6) Language and location. (0-10)
  let reachScore = 0;
  const languages = new Set(candidate.languages);
  const languageFits = project.projectLanguage === "MULTI"
    || (project.projectLanguage === "EN" && languages.has("English"))
    || (project.projectLanguage === "PL" && languages.has("Polish"));
  if (languageFits) {
    reachScore += 6;
    reasons.push({ points: 6, text: en ? "Speaks the project language" : "Zna język projektu" });
  } else if (languages.size > 0) {
    cautions.push(en ? "Profile does not list the project language" : "Na profilu nie ma języka używanego w projekcie");
  }
  const remoteFriendly = project.collaborationMode === "REMOTE" || project.marketScope === "WORLDWIDE";
  if (candidate.workModePreference === "REMOTE" && remoteFriendly) reachScore += 4;
  else if (candidate.country && project.country && candidate.country === project.country) {
    reachScore += 4;
    reasons.push({ points: 4, text: en ? `Same country: ${candidate.country}` : `Ten sam kraj: ${candidate.country}` });
  }

  const raw = roleScore + skillScore + gapScore + availabilityScore + levelScore + reachScore;
  const totalSlots = project.roles.reduce((sum, item) => sum + item.slots, 0);
  const filled = project.roles.reduce((sum, item) => sum + Math.min(item.filled, item.slots), 0);
  const target = project.roles.find((item) => item.id === roleId);
  const afterFilled = target && target.filled < target.slots ? filled + 1 : filled;

  return {
    score: Math.max(0, Math.min(100, raw)),
    reasons: reasons.sort((a, b) => b.points - a.points).slice(0, 4).map((item) => item.text),
    cautions: cautions.slice(0, 3),
    completeness: { filled, total: totalSlots, afterFilled },
    newSkills: newSkills.slice(0, 4),
  };
}
