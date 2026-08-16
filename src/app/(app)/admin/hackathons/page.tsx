import type { Metadata } from "next";
import { HackathonManager } from "@/components/admin/hackathon-manager";
import { listHackathonsForAdmin } from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Hackathons - BuildCrew Admin" };
export default async function AdminHackathonsPage() {
  const events = await listHackathonsForAdmin();
  return <div><div className="mb-5"><h2 className="text-xl font-semibold">Hackathons</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">Add real events, link official registration, and enable BuildCrew Team Finder for participants.</p></div><HackathonManager events={events.map((event) => ({ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), registrationDeadline: event.registrationDeadline?.toISOString() ?? null }))} /></div>;
}
