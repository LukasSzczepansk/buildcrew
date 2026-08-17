import type { LookingFor } from "@/db/schema";

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

export function opportunityStatusLabel(lookingFor: LookingFor[]) {
  if (isOpenToWork(lookingFor) && isOpenToBuilding(lookingFor)) return "Open to work and projects";
  if (isOpenToWork(lookingFor)) return "Open to work";
  if (isOpenToBuilding(lookingFor)) return "Open to building";
  if (lookingFor.includes("NETWORKING")) return "Open to networking";
  return null;
}
