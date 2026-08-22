import type { HackathonLocationType } from "@/db/schema";
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

const HACKATHON_PHASE_LABELS: Record<AppLocale, Record<HackathonPhase, string>> = {
  pl: {
    TEAM_FORMING: "Tworzenie zespołów",
    REGISTRATION_CLOSED: "Tworzenie zespołów zakończone",
    ONGOING: "W trakcie",
    ENDED: "Zakończony",
    CANCELLED: "Odwołany",
  },
  en: {
    TEAM_FORMING: "Team forming",
    REGISTRATION_CLOSED: "Team formation closed",
    ONGOING: "Ongoing",
    ENDED: "Ended",
    CANCELLED: "Cancelled",
  },
};

export function hackathonPhaseLabel(phase: HackathonPhase, locale: AppLocale = "pl") {
  return HACKATHON_PHASE_LABELS[locale][phase];
}

export function hackathonLocationLabel(locationType: HackathonLocationType, city?: string | null, locale: AppLocale = "pl") {
  if (locationType === "ONLINE") return locale === "en" ? "Online" : "Online";
  const prefix = locationType === "HYBRID"
    ? (locale === "en" ? "Hybrid" : "Hybrydowo")
    : (locale === "en" ? "On-site" : "Stacjonarnie");
  return city ? `${prefix} · ${city}` : prefix;
}

export function hackathonDateLabel(startsAt: Date, endsAt: Date, locale: AppLocale = "pl") {
  const localeCode = locale === "en" ? "en-US" : "pl-PL";
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  if (sameDay) {
    return startsAt.toLocaleDateString(localeCode, { day: "numeric", month: "long", year: "numeric" });
  }
  const sameYear = startsAt.getFullYear() === endsAt.getFullYear();
  const start = startsAt.toLocaleDateString(localeCode, { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
  const end = endsAt.toLocaleDateString(localeCode, { day: "numeric", month: "short", year: "numeric" });
  return `${start} - ${end}`;
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
