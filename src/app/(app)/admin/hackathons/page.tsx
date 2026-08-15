import type { Metadata } from "next";
import { HackathonManager } from "@/components/admin/hackathon-manager";
import { listHackathonsForAdmin } from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Hackathony - Admin BuildCrew" };
export default async function AdminHackathonsPage() {
  const events = await listHackathonsForAdmin();
  return <div><div className="mb-5"><h2 className="text-xl font-semibold">Hackathony</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">Dodawaj prawdziwe wydarzenia, linkuj oficjalne zapisy i uruchamiaj dla uczestników BuildCrew Team Finder.</p></div><HackathonManager events={events.map((event) => ({ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), registrationDeadline: event.registrationDeadline?.toISOString() ?? null }))} /></div>;
}
