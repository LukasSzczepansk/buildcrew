import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/legal-footer";
import { HackathonEventShareButton } from "@/components/hackathons/hackathon-event-share-button";
import { HackathonIdentityMark } from "@/components/hackathons/hackathon-identity-mark";
import { JsonLd } from "@/components/seo/json-ld";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { getHackathonPhase, hackathonPhaseLabel, hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import { getHackathonBySlug, getHackathonRoleCounts, getHackathonStats, listHackathonTeams, teamMissingRoles } from "@/server/data/hackathons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const en = locale === "en";
  const event = await getHackathonBySlug(slug);
  if (!event) return { title: "Hackathon - BuildCrew", robots: { index: false, follow: false } };
  const title = `${event.name} - ${en ? "find a team" : "find a team"} | BuildCrew`;
  const description = `${event.summary} ${en ? "Find people and teams forming around the same event." : "Find people and teams forming for the same event."}`;
  return {
    title,
    description,
    alternates: { canonical: `/explore/hackathons/${event.slug}` },
    openGraph: { type: "website", locale: en ? "en_US" : "pl_PL", siteName: "BuildCrew", title, description, url: `/explore/hackathons/${event.slug}` },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicHackathonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();
  const [stats, roleCounts, teams] = await Promise.all([
    getHackathonStats(event.id),
    getHackathonRoleCounts(event.id),
    listHackathonTeams(event.id),
  ]);
  const phase = getHackathonPhase(event);
  const allOpenTeams = teams.filter((team) => team.members.length < team.targetSize);
  const openTeams = allOpenTeams.slice(0, 5);
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventAttendanceMode: event.locationType === "ONLINE" ? "https://schema.org/OnlineEventAttendanceMode" : event.locationType === "HYBRID" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    url: event.officialUrl,
    organizer: event.organizerName ? { "@type": "Organization", name: event.organizerName, url: event.organizerUrl ?? undefined } : undefined,
  };

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={eventJsonLd} />
      <header className="border-b border-[var(--bc-line)]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" />BuildCrew</Link>
          <div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/explore/hackathons">{en ? "Hackathons" : "Hackathons"}</Link></Button><Button asChild size="sm"><Link href={`/signup?next=/hackathons/${event.slug}#join`}>{en ? "Find a team" : "Find a team"}</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
        <Link href="/explore/hackathons" className="text-[13px] font-medium text-[var(--bc-muted)] hover:underline">← {en ? "All hackathons" : "All hackathons"}</Link>

        <section className="mt-5 overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
          <div className="grid gap-7 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-7 lg:py-7">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                <HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-16 w-16 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Find your team</p>
                    <Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{hackathonPhaseLabel(phase, locale)}</Badge>
                    {event.isPartner ? <Badge variant="outline">{en ? "BuildCrew partner" : "BuildCrew partner"}</Badge> : null}
                  </div>
                  <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">{event.name}</h1>
                  <p className="mt-3 max-w-[760px] text-[15px] leading-6 text-[var(--bc-muted)]">{event.summary}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-[var(--bc-line)] py-3.5 text-[13px] text-[var(--bc-muted)]">
                <span className="font-medium text-[var(--bc-ink)]">{hackathonDateLabel(event.startsAt, event.endsAt, locale)}</span>
                <span>{hackathonLocationLabel(event.locationType, event.city, locale)}</span>
                <span>{en ? "Team" : "Team"} {event.minTeamSize}–{event.maxTeamSize} {en ? "people" : "people"}</span>
                {event.organizerName ? <span>{en ? "Organizer:" : "Organizer:"} {event.organizerName}</span> : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="lg"><Link href={`/signup?next=/hackathons/${event.slug}#join`}>{en ? "I need a team" : "Looking for a team"} <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href={`/signup?next=/hackathons/${event.slug}#teams`}>{en ? "We have a team and need someone" : "We have a team and need one more person"}</Link></Button>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--bc-faint)]">{en ? "BuildCrew does not register you for the event. It only helps you find and complete a team." : "BuildCrew does not register you for the event. It only helps you find and form a team."}</p>
            </div>

            <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Team finder right now" : "Team finder right now"}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div><p className="text-[26px] font-semibold tabular-nums">{stats.lookingCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{en ? "looking for a team" : "looking for a team"}</p></div>
                <div><p className="text-[26px] font-semibold tabular-nums">{stats.teamCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{en ? "teams" : "teams"}</p></div>
                <div><p className="text-[26px] font-semibold tabular-nums">{allOpenTeams.length}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">{en ? "open teams" : "open teams"}</p></div>
              </div>
              <div className="mt-5 border-t border-[var(--bc-line)] pt-3"><HackathonEventShareButton shortPath={`/h/${event.slug}`} /></div>
            </div>
          </div>

          <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] md:grid-cols-3">
            <div className="px-5 py-4 md:border-r md:border-[var(--bc-line)]"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "01 · Set context" : "01 · Set your context"}</p><p className="mt-1 text-[13px] font-medium">{en ? "Role, stack, availability and direction." : "Role, stack, availability, and goals."}</p></div>
            <div className="border-t border-[var(--bc-line)] px-5 py-4 md:border-r md:border-t-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "02 · See matches" : "02 · View matches"}</p><p className="mt-1 text-[13px] font-medium">{en ? "People and teams from the same event." : "People and teams from the same event."}</p></div>
            <div className="border-t border-[var(--bc-line)] px-5 py-4 md:border-t-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "03 · Complete your team" : "03 · Complete your team"}</p><p className="mt-1 text-[13px] font-medium">{en ? "Invites, missing roles and team progress such as 2/4 or 3/4." : "Invitations, missing roles, and team status such as 2/4 or 3/4."}</p></div>
          </div>
        </section>

        <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-9">
            <section>
              <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Easiest way in" : "Easiest way in"}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">{en ? "Teams looking for people" : "Teams that still need people"}</h2></div>{openTeams.length ? <span className="text-[12px] text-[var(--bc-faint)]">{openTeams.length} {en ? "visible" : "widocznych"}</span> : null}</div>
              <div className="mt-3 border-t border-[var(--bc-line-strong)]">
                {openTeams.map((team) => {
                  const missing = teamMissingRoles(team.members);
                  const seats = team.targetSize - team.members.length;
                  return (
                    <article key={team.id} className="grid gap-4 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_230px_auto] sm:items-center">
                      <div><div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-semibold">{team.name}</p><span className="text-[12px] font-medium tabular-nums text-[var(--bc-muted)]">{team.members.length}/{team.targetSize}</span></div><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{team.ideaTitle || team.ideaSummary || (en ? "This team is forming for the event." : "This team is forming for the event.")}</p></div>
                      <div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{"Missing"}</p><p className="mt-1 text-[13px] font-medium">{missing.slice(0, Math.max(1, seats)).map((role) => labels.roles[role]).join(" / ") || `${seats} ${en ? (seats === 1 ? "person" : "people") : (seats === 1 ? "people" : "people")}`}</p></div>
                      <Button asChild size="sm" variant="outline"><Link href={`/explore/hackathons/${event.slug}/team/${team.id}`}>{en ? "View team" : "View team"} <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                    </article>
                  );
                })}
                {!openTeams.length ? <div className="border-b border-[var(--bc-line)] py-6"><p className="text-[14px] font-medium">{en ? "No open teams yet." : "There are no open teams yet."}</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{en ? "You can be one of the first people to start a team for this event." : "You can be one of the first people to start a team for this event."}</p></div> : null}
              </div>
            </section>

            <section>
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "People pool" : "Pula ludzi"}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">{en ? "Who is looking for a team" : "Who is currently looking for a team"}</h2></div>
              <div className="mt-3 border-t border-[var(--bc-line-strong)]">
                {roleCounts.map((row) => <div key={row.role} className="flex items-center justify-between border-b border-[var(--bc-line)] py-3.5 text-[14px]"><span>{labels.roles[row.role]}</span><span className="font-semibold tabular-nums">{row.count}</span></div>)}
                {!roleCounts.length ? <p className="border-b border-[var(--bc-line)] py-5 text-[13px] text-[var(--bc-muted)]">{en ? "No one has joined this event pool yet." : "No one has joined this event pool yet."}</p> : null}
              </div>
            </section>

            {event.description ? <section className="border-t border-[var(--bc-line-strong)] pt-6"><h2 className="text-[18px] font-semibold">{en ? "About the event" : "About the event"}</h2><p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--bc-muted)]">{event.description}</p></section> : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="border-t border-[var(--bc-line-strong)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{"Official information"}</p>
              <div className="mt-3 space-y-2"><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">{en ? "Event website" : "Event website"} <ExternalLink className="h-3.5 w-3.5" /></a>{event.registrationUrl ? <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">{en ? "Registration" : "Registration"} <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div>
            </div>
            <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Who this works best for" : "Who this works best for"}</p><div className="mt-3 space-y-3 text-[13px] leading-5 text-[var(--bc-muted)]"><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />{en ? "You are going solo and want to find 2–3 people." : "You are going solo and want to find 2–3 people."}</p><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />{en ? "You already have a team but are missing a specific role." : "You already have a team but are missing a specific role."}</p><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />{en ? "You do not have an idea yet but want to join an existing team." : "You do not have an idea yet but want to join an existing team."}</p></div></div>
            <div className="border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]"><p className="font-medium text-[var(--bc-ink)]">{en ? "Independent team finder" : "Independent team finder"}</p><p className="mt-1">{event.isPartner ? (en ? "This event is marked as a BuildCrew partner." : "This event is marked as a BuildCrew partner.") : (en ? "BuildCrew is not the organizer or an official partner of this event." : "BuildCrew is not the organizer or an official partner of this event.")} {en ? "Always check the current rules with the organizer." : "Aktualne zasady zawsze sprawdzaj u organizatora."}</p></div>
          </aside>
        </div>

        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
