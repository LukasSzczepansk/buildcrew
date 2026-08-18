import type { LookingFor } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

export const BUILDING_INTENTS: LookingFor[] = ["WANTS_PROJECT", "OPEN_TO_BUILD", "COFOUNDER"];
export const WORK_INTENTS: LookingFor[] = ["FULL_TIME", "FREELANCE", "INTERNSHIP"];
export const OPPORTUNITY_INTENTS: LookingFor[] = [...BUILDING_INTENTS, ...WORK_INTENTS, "NETWORKING"];

export function isOpenToBuilding(lookingFor: LookingFor[]) {
  return BUILDING_INTENTS.some((intent) => lookingFor.includes(intent));
}

export function isOpenToWork(lookingFor: LookingFor[]) {
  return WORK_INTENTS.some((intent) => lookingFor.includes(intent));
}

export function isOpenToOpportunities(lookingFor: LookingFor[]) {
  return OPPORTUNITY_INTENTS.some((intent) => lookingFor.includes(intent));
}

export function opportunityStatusLabel(lookingFor: LookingFor[], locale: AppLocale = "pl") {
  const en = locale === "en";
  if (isOpenToWork(lookingFor) && isOpenToBuilding(lookingFor)) return en ? "Open to work and projects" : "Otwarty na pracę i projekty";
  if (isOpenToWork(lookingFor)) return en ? "Open to work" : "Otwarty na pracę";
  if (isOpenToBuilding(lookingFor)) return en ? "Open to building" : "Otwarty na współpracę";
  if (lookingFor.includes("NETWORKING")) return en ? "Open to networking" : "Otwarty na networking";
  return null;
}
