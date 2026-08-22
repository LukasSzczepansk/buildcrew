import type { Metadata } from "next";
import { HackathonManager } from "@/components/admin/hackathon-manager";
import { getRequestLocale } from "@/lib/site-server";
import { listHackathonsForAdmin } from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Hackathons - BuildCrew Admin" };

export default async function AdminHackathonsPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const events = await listHackathonsForAdmin();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{en ? "Hackathons" : "Hackathony"}</h2>
        <p className="mt-1 text-sm text-[var(--bc-muted)]">{en ? "Add real events, link official registration, and enable BuildCrew team matching for participants." : "Dodawaj prawdziwe wydarzenia, podpinaj oficjalne zapisy i włączaj dobieranie zespołów BuildCrew dla uczestników."}</p>
      </div>
      <HackathonManager events={events.map((event) => ({ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), registrationDeadline: event.registrationDeadline?.toISOString() ?? null }))} />
    </div>
  );
}
