import type {
  FundingStage,
  ProjectLanguage,
  ProjectMarketScope,
  ProjectNeed,
  WorkModePreference,
} from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

export const LANGUAGE_OPTIONS = [
  "English",
  "Polish",
  "German",
  "Spanish",
  "French",
  "Italian",
  "Ukrainian",
  "Czech",
  "Dutch",
  "Portuguese",
] as const;

export const COUNTRY_OPTIONS = [
  "Poland",
  "Germany",
  "United Kingdom",
  "Netherlands",
  "Czechia",
  "Spain",
  "France",
  "Italy",
  "Portugal",
  "Ukraine",
  "United States",
  "Canada",
  "Other",
] as const;

const PL = {
  workMode: {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ON_SITE: "On-site",
    FLEXIBLE: "Elastycznie",
  } satisfies Record<WorkModePreference, string>,
  projectLanguage: {
    PL: "Polish",
    EN: "English",
    MULTI: "Multilingual",
  } satisfies Record<ProjectLanguage, string>,
  marketScope: {
    LOCAL: "Local",
    EUROPE: "Europa",
    WORLDWIDE: "Globalnie",
  } satisfies Record<ProjectMarketScope, string>,
  needs: {
    TEAMMATES: "Collaborators",
    FEEDBACK: "Feedbacku",
    BETA_TESTERS: "Beta testers",
    MENTOR: "Mentora",
    BUSINESS_PARTNER: "Partnera biznesowego",
    FUNDING: "Funding",
  } satisfies Record<ProjectNeed, string>,
  fundingStage: {
    GRANT: "Grant",
    ANGEL: "Angel investor",
    PRE_SEED: "Pre-seed",
    SEED: "Seed",
    OTHER: "Inne",
  } satisfies Record<FundingStage, string>,
};

const EN = {
  workMode: {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ON_SITE: "On-site",
    FLEXIBLE: "Flexible",
  } satisfies Record<WorkModePreference, string>,
  projectLanguage: {
    PL: "Polish",
    EN: "English",
    MULTI: "Multilingual",
  } satisfies Record<ProjectLanguage, string>,
  marketScope: {
    LOCAL: "Local",
    EUROPE: "Europe",
    WORLDWIDE: "Worldwide",
  } satisfies Record<ProjectMarketScope, string>,
  needs: {
    TEAMMATES: "Teammates",
    FEEDBACK: "Feedback",
    BETA_TESTERS: "Beta testers",
    MENTOR: "Mentor",
    BUSINESS_PARTNER: "Business partner",
    FUNDING: "Funding",
  } satisfies Record<ProjectNeed, string>,
  fundingStage: {
    GRANT: "Grant",
    ANGEL: "Angel",
    PRE_SEED: "Pre-seed",
    SEED: "Seed",
    OTHER: "Other",
  } satisfies Record<FundingStage, string>,
};

export function internationalLabels(_locale?: AppLocale) {
  return EN;
}

export const WORK_MODE_OPTIONS: readonly WorkModePreference[] = ["REMOTE", "HYBRID", "ON_SITE", "FLEXIBLE"];
export const PROJECT_LANGUAGE_OPTIONS: readonly ProjectLanguage[] = ["EN"];
export const PROJECT_MARKET_SCOPE_OPTIONS: readonly ProjectMarketScope[] = ["LOCAL", "EUROPE", "WORLDWIDE"];
export const PROJECT_NEED_OPTIONS: readonly ProjectNeed[] = ["TEAMMATES", "FEEDBACK", "BETA_TESTERS", "MENTOR", "BUSINESS_PARTNER", "FUNDING"];
export const FUNDING_STAGE_OPTIONS: readonly FundingStage[] = ["GRANT", "ANGEL", "PRE_SEED", "SEED", "OTHER"];
