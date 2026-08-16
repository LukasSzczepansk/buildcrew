import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { HackathonCard } from "@/components/hackathons/hackathon-card";
import { Button } from "@/components/ui/button";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
import { getRequestLocale } from "@/lib/site-server";
import { listPublishedHackathons } from "@/server/data/hackathons";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Hackathons - BuildCrew" : "Hackathons - BuildCrew" };
}

function eventWord(count: number, locale: "pl" | "en") {
  if (locale === "en") return count === 1 ? "hackathon" : "hackathons";
  if (count === 1) return "hackathon";
  if (count >= 2 && count <= 4) return "hackathons";
  return "hackathons";
}
function peopleWord(count: number, locale: "pl" | "en") {
  if (locale === "en") return count === 1 ? "person" : "people";
  if (count === 1) return "person";
  if (count >= 2 && count <= 4) return "people";
  return "people";
}
function teamWord(count: number, locale: "pl" | "en") {
  if (locale === "en") return count === 1 ? "team" : "teams";
  if (count === 1) return "team";
  if (count >= 2 && count <= 4) return "teams";
  return "teams";
}

export default async function HackathonsPage() {
  const locale = await getRequestLocale();
  const copy = (pl: string, en: string) => locale === "en" ? en : pl;
  const events = await listPublishedHackathons();
  const lookingCount = events.reduce((sum, event) => sum + event.lookingCount, 0);
  const teamCount = events.reduce((sum, event) => sum + event.teamCount, 0);

  const headline = lookingCount > 0
    ? locale === "en"
      ? `${lookingCount} ${peopleWord(lookingCount, locale)} looking for a team across ${events.length} ${eventWord(events.length, locale)}.`
      : `${lookingCount} ${peopleWord(lookingCount, locale)} are looking for a team across ${events.length} ${eventWord(events.length, locale)}.`
    : events.length > 0
      ? copy(`Explore ${events.length} ${eventWord(events.length, locale)} and start building your team.`, `Explore ${events.length} ${eventWord(events.length, locale)} and start building your team.`)
      : copy("New hackathons will appear here as soon as we verify them.", "New hackathons will appear here as soon as we verify them.");

  return (
    <div>
      <Topbar title={copy("Hackathons", "Hackathons")} subtitle={copy("Find people attending the same event, fill missing roles or let BuildCrew suggest a team.", "Find people attending the same event, fill missing roles or let BuildCrew suggest a team.")} />
      <div className="mb-5"><DiscoveryTabs active="hackathons" /></div>
      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">{copy("Right now", "Right now")}</p>
            <h2 className="mt-2 max-w-[820px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">{headline}</h2>
            <p className="mt-2 max-w-[760px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("BuildCrew helps you find a team. Official event registration still happens through the organizer.", "BuildCrew helps you find a team. Official event registration still happens through the organizer.")}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm"><Link href="#upcoming"><UsersRound className="h-3.5 w-3.5" /> {copy("Find a team", "Find a team")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/explore/hackathons" target="_blank">{copy("Public directory", "Public directory")} <ExternalLink className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
        </div>
        <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:grid-cols-3">
          <div className="px-5 py-3.5 sm:border-r sm:border-[var(--bc-line)] md:px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">01 · {copy("Event", "Event")}</p><p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Choose the hackathon you actually plan to attend.", "Choose the hackathon you actually plan to attend.")}</p></div>
          <div className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-r sm:border-t-0 md:px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">02 · {copy("Profile", "Profile")}</p><p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Set your role, stack, interests and availability.", "Set your role, stack, interests and availability.")}</p></div>
          <div className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-t-0 md:px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">03 · Team</p><p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Find people yourself or review a suggested team.", "Find people yourself or review a suggested team.")}</p></div>
        </div>
      </section>

      <section id="upcoming" className="mt-8 scroll-mt-24">
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-[20px] font-semibold leading-7 tracking-[-0.018em]">{copy("Upcoming and active", "Upcoming and active")}</h2><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{copy("Choose an event and see people who are also looking for a team.", "Choose an event and see people who are also looking for a team.")}</p></div><div className="hidden items-center gap-5 text-[12px] tabular-nums text-[var(--bc-faint)] sm:flex"><span>{events.length} {eventWord(events.length, locale)}</span>{lookingCount > 0 ? <span>{`${lookingCount} looking for a team`}</span> : null}{teamCount > 0 ? <span>{teamCount} {teamWord(teamCount, locale)}</span> : null}</div></div>
        <div className="mt-3 border-t border-[var(--bc-line-strong)]">{events.map((event) => <HackathonCard key={event.id} event={event} href={`/hackathons/${event.slug}`} />)}</div>
        {!events.length ? <div className="border-b border-[var(--bc-line)] py-8"><p className="text-[15px] font-medium">{copy("No published hackathons yet.", "No published hackathons yet.")}</p><p className="mt-1 max-w-2xl text-[13px] leading-5 text-[var(--bc-muted)]">{copy("We only add events we have been able to verify. New ones will appear here once available.", "We only add events we have been able to verify. New ones will appear here once available.")}</p></div> : null}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-5 text-[12px] text-[var(--bc-muted)]"><span>{copy("Can't find the event you're attending?", "Can't find the event you're attending?")}</span><Link href="/help/new" className="inline-flex items-center gap-1.5 font-medium text-[var(--bc-ink)] hover:underline">{copy("Let us know", "Let us know")} <ArrowRight className="h-3.5 w-3.5" /></Link></div>
    </div>
  );
}
