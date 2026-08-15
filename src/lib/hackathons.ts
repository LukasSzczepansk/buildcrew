import type { HackathonLocationType } from "@/db/schema";
import { HACKATHON_LOCATION_LABELS } from "@/lib/constants";

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

export const HACKATHON_PHASE_LABELS: Record<HackathonPhase, string> = {
  TEAM_FORMING: "Szukamy ekip",
  REGISTRATION_CLOSED: "Dobór ekip zamknięty",
  ONGOING: "Trwa",
  ENDED: "Zakończony",
  CANCELLED: "Odwołany",
};

export function hackathonLocationLabel(locationType: HackathonLocationType, city?: string | null) {
  if (locationType === "ONLINE") return HACKATHON_LOCATION_LABELS.ONLINE;
  const prefix = locationType === "HYBRID" ? "Hybrydowo" : "Stacjonarnie";
  return city ? `${prefix} · ${city}` : prefix;
}

export function hackathonDateLabel(startsAt: Date, endsAt: Date) {
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  if (sameDay) {
    return startsAt.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  }
  const sameYear = startsAt.getFullYear() === endsAt.getFullYear();
  const start = startsAt.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
  const end = endsAt.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
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
