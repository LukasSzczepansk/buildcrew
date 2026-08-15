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
import { ROLE_LABELS } from "@/lib/constants";
import { getHackathonPhase, HACKATHON_PHASE_LABELS, hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import { getHackathonBySlug, getHackathonRoleCounts, getHackathonStats, listHackathonTeams, teamMissingRoles } from "@/server/data/hackathons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) return { title: "Hackathon - BuildCrew", robots: { index: false, follow: false } };
  const title = `${event.name} - znajdź zespół | BuildCrew`;
  const description = `${event.summary} Znajdź osoby i teamy, które kompletują skład na to samo wydarzenie.`;
  return {
    title,
    description,
    alternates: { canonical: `/hackathony/${event.slug}` },
    openGraph: { type: "website", locale: "pl_PL", siteName: "BuildCrew", title, description, url: `/hackathony/${event.slug}` },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicHackathonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
          <div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/hackathony">Hackathony</Link></Button><Button asChild size="sm"><Link href={`/signup?next=/hackathons/${event.slug}#join`}>Znajdź team</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
        <Link href="/hackathony" className="text-[13px] font-medium text-[var(--bc-muted)] hover:underline">← Wszystkie hackathony</Link>

        <section className="mt-5 overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
          <div className="grid gap-7 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-7 lg:py-7">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                <HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-16 w-16 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Find your team</p>
                    <Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{HACKATHON_PHASE_LABELS[phase]}</Badge>
                    {event.isPartner ? <Badge variant="outline">Partner BuildCrew</Badge> : null}
                  </div>
                  <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">{event.name}</h1>
                  <p className="mt-3 max-w-[760px] text-[15px] leading-6 text-[var(--bc-muted)]">{event.summary}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-[var(--bc-line)] py-3.5 text-[13px] text-[var(--bc-muted)]">
                <span className="font-medium text-[var(--bc-ink)]">{hackathonDateLabel(event.startsAt, event.endsAt)}</span>
                <span>{hackathonLocationLabel(event.locationType, event.city)}</span>
                <span>Team {event.minTeamSize}–{event.maxTeamSize} osób</span>
                {event.organizerName ? <span>Organizator: {event.organizerName}</span> : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="lg"><Link href={`/signup?next=/hackathons/${event.slug}#join`}>Szukam zespołu <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href={`/signup?next=/hackathons/${event.slug}#teams`}>Mamy team, brakuje nam osoby</Link></Button>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--bc-faint)]">BuildCrew nie zapisuje Cię na wydarzenie. Pomaga tylko znaleźć i skompletować ekipę.</p>
            </div>

            <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Team finder na teraz</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div><p className="text-[26px] font-semibold tabular-nums">{stats.lookingCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">szuka teamu</p></div>
                <div><p className="text-[26px] font-semibold tabular-nums">{stats.teamCount}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">teamów</p></div>
                <div><p className="text-[26px] font-semibold tabular-nums">{allOpenTeams.length}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-faint)]">otwartych składów</p></div>
              </div>
              <div className="mt-5 border-t border-[var(--bc-line)] pt-3"><HackathonEventShareButton shortPath={`/h/${event.slug}`} /></div>
            </div>
          </div>

          <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] md:grid-cols-3">
            <div className="px-5 py-4 md:border-r md:border-[var(--bc-line)]"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">01 · Ustaw kontekst</p><p className="mt-1 text-[13px] font-medium">Rola, stack, dostępność i kierunek.</p></div>
            <div className="border-t border-[var(--bc-line)] px-5 py-4 md:border-r md:border-t-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">02 · Zobacz dopasowania</p><p className="mt-1 text-[13px] font-medium">Ludzie i teamy z tego samego wydarzenia.</p></div>
            <div className="border-t border-[var(--bc-line)] px-5 py-4 md:border-t-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">03 · Skompletuj ekipę</p><p className="mt-1 text-[13px] font-medium">Zaproszenia, brakujące role i team 2/4, 3/4.</p></div>
          </div>
        </section>

        <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-9">
            <section>
              <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Najłatwiejsze wejście</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Teamy, którym brakuje ludzi</h2></div>{openTeams.length ? <span className="text-[12px] text-[var(--bc-faint)]">{openTeams.length} widocznych</span> : null}</div>
              <div className="mt-3 border-t border-[var(--bc-line-strong)]">
                {openTeams.map((team) => {
                  const missing = teamMissingRoles(team.members);
                  const seats = team.targetSize - team.members.length;
                  return (
                    <article key={team.id} className="grid gap-4 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_230px_auto] sm:items-center">
                      <div><div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-semibold">{team.name}</p><span className="text-[12px] font-medium tabular-nums text-[var(--bc-muted)]">{team.members.length}/{team.targetSize}</span></div><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{team.ideaTitle || team.ideaSummary || "Team kompletuje skład na to wydarzenie."}</p></div>
                      <div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Brakuje</p><p className="mt-1 text-[13px] font-medium">{missing.slice(0, Math.max(1, seats)).map((role) => ROLE_LABELS[role]).join(" / ") || `${seats} ${seats === 1 ? "osoby" : "osób"}`}</p></div>
                      <Button asChild size="sm" variant="outline"><Link href={`/hackathony/${event.slug}/team/${team.id}`}>Zobacz team <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                    </article>
                  );
                })}
                {!openTeams.length ? <div className="border-b border-[var(--bc-line)] py-6"><p className="text-[14px] font-medium">Nie ma jeszcze otwartych teamów.</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">Możesz być jedną z pierwszych osób, które uruchomią skład dla tego wydarzenia.</p></div> : null}
              </div>
            </section>

            <section>
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Pula ludzi</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Kto aktualnie szuka teamu</h2></div>
              <div className="mt-3 border-t border-[var(--bc-line-strong)]">
                {roleCounts.map((row) => <div key={row.role} className="flex items-center justify-between border-b border-[var(--bc-line)] py-3.5 text-[14px]"><span>{ROLE_LABELS[row.role]}</span><span className="font-semibold tabular-nums">{row.count}</span></div>)}
                {!roleCounts.length ? <p className="border-b border-[var(--bc-line)] py-5 text-[13px] text-[var(--bc-muted)]">Nikt jeszcze nie dołączył do puli tego wydarzenia.</p> : null}
              </div>
            </section>

            {event.description ? <section className="border-t border-[var(--bc-line-strong)] pt-6"><h2 className="text-[18px] font-semibold">O wydarzeniu</h2><p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--bc-muted)]">{event.description}</p></section> : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="border-t border-[var(--bc-line-strong)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Oficjalne informacje</p>
              <div className="mt-3 space-y-2"><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">Strona wydarzenia <ExternalLink className="h-3.5 w-3.5" /></a>{event.registrationUrl ? <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">Rejestracja <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div>
            </div>
            <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Dla kogo to działa najlepiej</p><div className="mt-3 space-y-3 text-[13px] leading-5 text-[var(--bc-muted)]"><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />Jedziesz sam i chcesz znaleźć 2–3 osoby.</p><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />Macie już team, ale brakuje konkretnej roli.</p><p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0" />Nie masz pomysłu, ale chcesz wejść do istniejącego składu.</p></div></div>
            <div className="border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]"><p className="font-medium text-[var(--bc-ink)]">Niezależny team finder</p><p className="mt-1">{event.isPartner ? "To wydarzenie jest oznaczone jako partner BuildCrew." : "BuildCrew nie jest organizatorem ani oficjalnym partnerem tego wydarzenia."} Aktualne zasady zawsze sprawdzaj u organizatora.</p></div>
          </aside>
        </div>

        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
