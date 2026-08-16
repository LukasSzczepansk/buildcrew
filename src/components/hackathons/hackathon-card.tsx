import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import type { HackathonLocationType } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HackathonIdentityMark } from "@/components/hackathons/hackathon-identity-mark";
import { getRequestLocale } from "@/lib/site-server";
import { getHackathonPhase, hackathonDateLabel, hackathonLocationLabel, hackathonPhaseLabel } from "@/lib/hackathons";

export async function HackathonCard({ event, href }: { event: { id: string; name: string; summary: string; startsAt: Date; endsAt: Date; registrationDeadline: Date | null; isCancelled: boolean; locationType: HackathonLocationType; city: string | null; themes: string[]; coverImageUrl: string | null; participantCount: number; lookingCount: number; teamCount: number; isPartner: boolean; }; href: string; }) {
  const locale = await getRequestLocale();
  const copy = (pl: string, en: string) => locale === "en" ? en : pl;
  const phase = getHackathonPhase(event);
  const teamForming = phase === "TEAM_FORMING";
  return (
    <article className="group grid gap-5 border-b border-[var(--bc-line)] py-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center lg:gap-8">
      <div className="flex min-w-0 gap-4"><HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-16 w-16" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[18px] font-semibold leading-6 tracking-[-0.02em] text-[var(--bc-ink)]"><Link href={href} className="hover:underline">{event.name}</Link></h3><Badge variant={teamForming ? "default" : "secondary"}>{hackathonPhaseLabel(phase, locale)}</Badge>{event.isPartner ? <Badge variant="outline">BuildCrew Partner</Badge> : null}</div><p className="mt-1.5 max-w-[760px] text-[14px] leading-5 text-[var(--bc-muted)]">{event.summary}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--bc-faint)]"><span className="font-medium text-[var(--bc-muted)]">{hackathonDateLabel(event.startsAt, event.endsAt, locale)}</span><span aria-hidden="true">·</span><span>{hackathonLocationLabel(event.locationType, event.city, locale)}</span>{event.themes.slice(0, 3).map((theme) => <span key={theme} className="before:mr-3 before:content-['·']">{theme}</span>)}</div></div></div>
      <div className="border-t border-[var(--bc-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Team finder</p><div className="mt-2.5 grid grid-cols-3 gap-3"><div><p className="text-[17px] font-semibold tabular-nums text-[var(--bc-ink)]">{event.participantCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{copy("uczestników", "participants")}</p></div><div><p className="inline-flex items-center gap-1.5 text-[17px] font-semibold tabular-nums text-[var(--bc-ink)]"><UsersRound className="h-3.5 w-3.5 text-[var(--bc-muted)]" />{event.lookingCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{copy("szuka teamu", "looking for a team")}</p></div><div><p className="text-[17px] font-semibold tabular-nums text-[var(--bc-ink)]">{event.teamCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{copy("zespołów", "teams")}</p></div></div><div className="mt-3.5 flex items-center gap-2"><Button asChild size="sm" variant={teamForming ? "default" : "outline"} className="min-w-0 flex-1 justify-between"><Link href={href}>{teamForming ? copy("Znajdź zespół", "Find a team") : copy("Zobacz wydarzenie", "View event")}<ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0" /></Link></Button></div></div>
    </article>
  );
}
