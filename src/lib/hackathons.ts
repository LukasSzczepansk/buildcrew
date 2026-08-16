import type { HackathonLocationType } from "@/db/schema";
import { HACKATHON_LOCATION_LABELS } from "@/lib/constants";
import type { AppLocale } from "@/lib/site-config";

export type HackathonPhase = "TEAM_FORMING" | "REGISTRATION_CLOSED" | "ONGOING" | "ENDED" | "CANCELLED";

export function getHackathonPhase(hackathon: {
  startsAt: Date;
  endsAt: Date;
  registrationDeadline: Date | null;
  isCancelled: boolean;
}, now = new Date()): HackathonPhase {
  if (hackathon.isCancelled) return "CANCELLED";
  if (hackathon.endsAt.getTime() < now.getTime()) return "ENDED";
  if (hackathon.startsAt.getTime() <= now.getTime()) return "ONGOING";
  const deadline = hackathon.registrationDeadline ?? hackathon.startsAt;
  if (deadline.getTime() < now.getTime()) return "REGISTRATION_CLOSED";
  return "TEAM_FORMING";
}

export const HACKATHON_PHASE_LABELS_EN: Record<HackathonPhase, string> = {
  TEAM_FORMING: "Team forming",
  REGISTRATION_CLOSED: "Team formation closed",
  ONGOING: "Ongoing",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

export function hackathonPhaseLabel(phase: HackathonPhase, _locale: AppLocale = "en") {
  return HACKATHON_PHASE_LABELS_EN[phase];
}

export function hackathonLocationLabel(locationType: HackathonLocationType, city?: string | null, _locale: AppLocale = "en") {
  if (locationType === "ONLINE") return "Online";
  const prefix = locationType === "HYBRID" ? "Hybrid" : "On-site";
  return city ? `${prefix} · ${city}` : prefix;
}

export function hackathonDateLabel(startsAt: Date, endsAt: Date, _locale: AppLocale = "en") {
  const localeCode = "en-US";
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  if (sameDay) {
    return startsAt.toLocaleDateString(localeCode, { day: "numeric", month: "long", year: "numeric" });
  }
  const sameYear = startsAt.getFullYear() === endsAt.getFullYear();
  const start = startsAt.toLocaleDateString(localeCode, { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
  const end = endsAt.toLocaleDateString(localeCode, { day: "numeric", month: "short", year: "numeric" });
  return `${start} – ${end}`;
}

export function slugifyHackathonName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "hackathon";
}
