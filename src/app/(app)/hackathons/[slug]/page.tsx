import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HackathonEventShareButton } from "@/components/hackathons/hackathon-event-share-button";
import { HackathonIdentityMark } from "@/components/hackathons/hackathon-identity-mark";
import { HackathonJoinForm } from "@/components/hackathons/hackathon-join-form";
import { HackathonTeamShareButton } from "@/components/hackathons/hackathon-team-share-button";
import { CreateHackathonTeamForm } from "@/components/hackathons/create-hackathon-team-form";
import {
  HackathonInviteDecision,
  HackathonRequestDecision,
  InviteHackathonParticipantButton,
  LeaveHackathonTeamButton,
  PauseHackathonMatchingButton,
  RequestToJoinTeamButton,
  SuggestedTeamButton,
} from "@/components/hackathons/hackathon-actions";
import { getCurrentUser } from "@/lib/auth";
import { HACKATHON_AVAILABILITY_LABELS, HACKATHON_GOAL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { getHackathonPhase, HACKATHON_PHASE_LABELS, hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import {
  getHackathonBySlug,
  getHackathonParticipation,
  getHackathonRoleCounts,
  getHackathonStats,
  getHackathonTeamForUser,
  listHackathonMatches,
  listHackathonTeams,
  listIncomingHackathonInvites,
  listPendingHackathonTeamRequests,
  teamMissingRoles,
} from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Znajdź team na hackathon — BuildCrew" };

export default async function HackathonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();
  const phase = getHackathonPhase(event);

  const [stats, roleCounts, participation, team, invites] = await Promise.all([
    getHackathonStats(event.id),
    getHackathonRoleCounts(event.id),
    getHackathonParticipation(event.id, user.id),
    getHackathonTeamForUser(event.id, user.id),
    listIncomingHackathonInvites(event.id, user.id),
  ]);

  const needsCandidates = participation?.status === "LOOKING" || Boolean(team?.viewerIsLead && team.members.length < team.targetSize);
  const [matches, teams, requests] = await Promise.all([
    needsCandidates ? listHackathonMatches(event.id, user.id) : Promise.resolve([]),
    listHackathonTeams(event.id, user.id),
    team?.viewerIsLead ? listPendingHackathonTeamRequests(team.id, user.id) : Promise.resolve([]),
  ]);
  const openTeams = teams.filter((item) => item.members.length < item.targetSize);
  const myMissingRoles = team ? teamMissingRoles(team.members) : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/hackathons" className="text-[13px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">← Wszystkie hackathony</Link>
        <HackathonEventShareButton shortPath={`/h/${event.slug}`} />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-4">
              <HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-16 w-16 shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Find your team</p>
                  <Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{HACKATHON_PHASE_LABELS[phase]}</Badge>
                  {event.isPartner ? <Badge variant="outline">Partner BuildCrew</Badge> : null}
                </div>
                <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[36px]">{event.name}</h1>
                <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-[var(--bc-muted)]">{event.summary}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-[var(--bc-line)] py-3 text-[13px] text-[var(--bc-muted)]">
              <span className="font-medium text-[var(--bc-ink)]">{hackathonDateLabel(event.startsAt, event.endsAt)}</span>
              <span>{hackathonLocationLabel(event.locationType, event.city)}</span>
              <span>Team {event.minTeamSize}–{event.maxTeamSize} osób</span>
              {event.organizerName ? <span>Organizator: {event.organizerName}</span> : null}
            </div>

            {phase === "TEAM_FORMING" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {!team && participation?.status !== "LOOKING" ? <Button asChild><Link href="#join">Szukam zespołu <ArrowRight className="h-3.5 w-3.5" /></Link></Button> : null}
                {!team && participation?.status === "LOOKING" ? <SuggestedTeamButton hackathonId={event.id} /> : null}
                {!team && participation?.status === "LOOKING" ? <CreateHackathonTeamForm hackathonId={event.id} minTeamSize={event.minTeamSize} maxTeamSize={event.maxTeamSize} /> : null}
                {team ? <Button asChild><Link href="#my-team">Twój team · {team.members.length}/{team.targetSize}</Link></Button> : null}
                <Button asChild variant="outline"><Link href="#teams">Zespoły szukające osób</Link></Button>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Pula BuildCrew</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><p className="text-[24px] font-semibold tabular-nums">{stats.lookingCount}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">szuka teamu</p></div>
              <div><p className="text-[24px] font-semibold tabular-nums">{stats.teamCount}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">teamów</p></div>
              <div><p className="text-[24px] font-semibold tabular-nums">{openTeams.length}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">otwartych</p></div>
            </div>
            <div className="mt-4 border-t border-[var(--bc-line)] pt-3 text-[12px] leading-5 text-[var(--bc-muted)]">
              {team ? <p>Masz już team. Najważniejsze teraz: uzupełnić brakujące role i potwierdzić skład.</p> : participation?.status === "LOOKING" ? <p>Jesteś widoczny w puli. Możesz przeglądać osoby, teamy albo poprosić BuildCrew o propozycję składu.</p> : <p>Ustaw kontekst wydarzenia w około minutę. Matching zacznie działać od razu.</p>}
            </div>
          </div>
        </div>

        <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:grid-cols-3">
          <a href="#join" className="px-5 py-3.5 sm:border-r sm:border-[var(--bc-line)]"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">01</p><p className="mt-0.5 text-[13px] font-medium">Ustaw profil wydarzenia</p></a>
          <a href="#people" className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-r sm:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">02</p><p className="mt-0.5 text-[13px] font-medium">Poznaj dopasowane osoby</p></a>
          <a href="#teams" className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">03</p><p className="mt-0.5 text-[13px] font-medium">Skompletuj team</p></a>
        </div>
      </section>

      <div className="grid gap-8 pt-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-9">
          {invites.length && !team ? (
            <section className="border-l-2 border-[var(--bc-accent)] pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Zaproszenia · {invites.length}</p>
              <div className="mt-3 space-y-3">{invites.map((invite) => <div key={invite.id} className="flex flex-col gap-3 border-b border-[var(--bc-line)] pb-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[14px] font-semibold">{invite.teamName}</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{invite.inviterUsername} zaprasza Cię do teamu.{invite.message ? ` ${invite.message}` : ""}</p></div><HackathonInviteDecision inviteId={invite.id} /></div>)}</div>
            </section>
          ) : null}

          {phase === "TEAM_FORMING" && !team ? (
            <HackathonJoinForm
              hackathonId={event.id}
              eventThemes={event.themes}
              minTeamSize={event.minTeamSize}
              maxTeamSize={event.maxTeamSize}
              initial={participation ? { role: participation.role, technologies: participation.technologies, themes: participation.themes, hasIdea: participation.hasIdea, ideaSummary: participation.ideaSummary, goal: participation.goal, availability: participation.availability, preferredTeamSize: participation.preferredTeamSize } : null}
            />
          ) : null}

          {phase === "TEAM_FORMING" && participation?.status === "LOOKING" && !team ? (
            <section id="people" className="scroll-mt-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Dla Ciebie</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Osoby, z którymi warto porozmawiać</h2><p className="mt-1 max-w-[700px] text-[13px] leading-5 text-[var(--bc-muted)]">Nie pokazujemy magicznego „AI match”. Wynik wynika z roli, stacku, zainteresowań, celu i dostępności.</p></div>
                <SuggestedTeamButton hackathonId={event.id} />
              </div>

              <div className="mt-4 border-t border-[var(--bc-line-strong)]">
                {matches.map((match) => (
                  <article key={match.userId} className="grid gap-4 border-b border-[var(--bc-line)] py-4 lg:grid-cols-[220px_minmax(0,1fr)_120px] lg:items-center">
                    <Link href={`/builders/${match.userId}`} className="flex items-center gap-3"><Avatar username={match.username} seed={match.avatarEmoji || match.userId} size="sm" className="h-10 w-10 text-[12px]" /><div className="min-w-0"><p className="truncate text-[14px] font-semibold">{match.username}</p><p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{ROLE_LABELS[match.role]}</p></div></Link>
                    <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Dlaczego warto pogadać</p><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{match.reasons.slice(0, 2).join(" ") || "Jesteście w tej samej puli wydarzenia."}</p>{match.technologies.length ? <p className="mt-1.5 truncate text-[12px] text-[var(--bc-faint)]">{match.technologies.slice(0, 5).join(" · ")}</p> : null}</div>
                    <div className="flex items-center justify-between gap-3 lg:block lg:text-right"><span className="text-[15px] font-semibold tabular-nums">{match.score}%</span><Button asChild size="sm" variant="outline" className="lg:mt-2"><Link href={`/builders/${match.userId}`}>Profil</Link></Button></div>
                  </article>
                ))}
                {!matches.length ? <div className="border-b border-[var(--bc-line)] py-6"><p className="text-[14px] font-medium">Jesteś jedną z pierwszych osób w tej puli.</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">Twój profil wydarzenia będzie widoczny dla kolejnych uczestników.</p></div> : null}
              </div>
            </section>
          ) : null}

          {team ? (
            <section id="my-team" className="scroll-mt-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Twój team</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">{team.name}</h2><Badge variant={team.members.length >= team.targetSize ? "secondary" : "default"}>{team.members.length}/{team.targetSize}</Badge></div><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{team.ideaTitle || team.ideaSummary || "Skład na to wydarzenie."}</p></div>
                <div className="flex flex-wrap gap-2"><HackathonTeamShareButton eventName={event.name} teamName={team.name} sharePath={`/hackathony/${event.slug}/team/${team.id}`} missingRoles={myMissingRoles.slice(0, 2).map((role) => ROLE_LABELS[role])} /><LeaveHackathonTeamButton teamId={team.id} /></div>
              </div>

              <div className="mt-4 border-t border-[var(--bc-line-strong)]">
                {team.members.map((member) => <div key={member.userId} className="flex items-center justify-between gap-3 border-b border-[var(--bc-line)] py-3.5"><Link href={`/builders/${member.userId}`} className="flex items-center gap-3"><Avatar username={member.username} seed={member.avatarEmoji || member.userId} size="sm" className="h-10 w-10 text-[12px]" /><div><p className="text-[14px] font-semibold">{member.username}{member.isLead ? <span className="ml-2 text-[11px] font-medium text-[var(--bc-faint)]">prowadzący</span> : null}</p><p className="text-[12px] text-[var(--bc-muted)]">{member.role ? ROLE_LABELS[member.role] : "Builder"}</p></div></Link></div>)}
              </div>

              {team.viewerIsLead && team.members.length < team.targetSize ? (
                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4"><div><p className="text-[13px] font-semibold">Znajdź {team.targetSize - team.members.length === 1 ? "ostatnią osobę" : "brakujące osoby"}</p><p className="mt-1 text-[12px] text-[var(--bc-muted)]">Najpierw pokazujemy role, które uzupełniają obecny skład.</p></div><span className="text-[12px] text-[var(--bc-faint)]">{team.targetSize - team.members.length} wolne</span></div>
                  <div className="mt-3 border-t border-[var(--bc-line)]">{matches.slice(0, 6).map((match) => <div key={match.userId} className="grid gap-3 border-b border-[var(--bc-line)] py-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,1fr)_auto] sm:items-center"><div className="flex items-center gap-3"><Avatar username={match.username} seed={match.avatarEmoji || match.userId} size="sm" className="h-9 w-9 text-[11px]" /><div><p className="text-[14px] font-medium">{match.username}</p><p className="text-[12px] text-[var(--bc-muted)]">{ROLE_LABELS[match.role]}</p></div></div><p className="text-[12px] leading-5 text-[var(--bc-muted)]">{match.reasons[0] ?? "Szuka teamu na ten sam hackathon."}</p><InviteHackathonParticipantButton teamId={team.id} inviteeId={match.userId} /></div>)}</div>
                </div>
              ) : null}

              {requests.length ? <div className="mt-6"><p className="text-[13px] font-semibold">Zgłoszenia do teamu · {requests.length}</p><div className="mt-2 border-t border-[var(--bc-line)]">{requests.map((request) => <div key={request.id} className="flex flex-col gap-3 border-b border-[var(--bc-line)] py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar username={request.username} seed={request.avatarEmoji || request.applicantId} size="sm" className="h-9 w-9 text-[11px]" /><div><p className="text-[14px] font-medium">{request.username}{request.role ? ` · ${ROLE_LABELS[request.role]}` : ""}</p><p className="text-[12px] text-[var(--bc-muted)]">{request.message || "Chce dołączyć do Waszego teamu."}</p></div></div><HackathonRequestDecision requestId={request.id} /></div>)}</div></div> : null}
            </section>
          ) : null}

          <section id="teams" className="scroll-mt-24">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Teamy</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Zespoły szukające osób</h2><p className="mt-1 text-[13px] text-[var(--bc-muted)]">Jeśli nie chcesz organizować składu od zera, dołącz do teamu 2/4 lub 3/4.</p></div><span className="text-[12px] text-[var(--bc-faint)]">{openTeams.length} otwartych</span></div>
            <div className="mt-3 border-t border-[var(--bc-line-strong)]">
              {openTeams.map((item) => {
                const missing = teamMissingRoles(item.members);
                const seats = item.targetSize - item.members.length;
                return (
                  <article key={item.id} className="grid gap-4 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_230px_auto] sm:items-center">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-semibold">{item.name}</p><span className="text-[12px] font-medium tabular-nums text-[var(--bc-muted)]">{item.members.length}/{item.targetSize}</span></div><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{item.ideaTitle || item.ideaSummary || "Team szuka uzupełniających ról na wydarzenie."}</p></div>
                    <div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Brakuje</p><p className="mt-1 text-[13px] font-medium">{missing.slice(0, Math.max(1, seats)).map((role) => ROLE_LABELS[role]).join(" / ") || `${seats} ${seats === 1 ? "osoby" : "osób"}`}</p></div>
                    {team ? <Button asChild size="sm" variant="outline"><Link href={`/hackathony/${event.slug}/team/${item.id}`} target="_blank">Podgląd</Link></Button> : <RequestToJoinTeamButton teamId={item.id} disabled={!participation || participation.status !== "LOOKING" || phase !== "TEAM_FORMING"} alreadyRequested={item.viewerRequestStatus === "PENDING"} />}
                  </article>
                );
              })}
              {!openTeams.length ? <p className="border-b border-[var(--bc-line)] py-6 text-[13px] text-[var(--bc-muted)]">Nie ma jeszcze publicznie formujących się teamów.</p> : null}
            </div>
          </section>

          {event.description ? <section className="border-t border-[var(--bc-line-strong)] pt-6"><h2 className="text-[18px] font-semibold">O wydarzeniu</h2><p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--bc-muted)]">{event.description}</p></section> : null}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {participation ? <div className="border-t border-[var(--bc-line-strong)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Twoje ustawienia</p><dl className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">Rola</dt><dd className="font-medium">{ROLE_LABELS[participation.role]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">Cel</dt><dd className="max-w-[170px] text-right font-medium">{HACKATHON_GOAL_LABELS[participation.goal]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">Dostępność</dt><dd className="max-w-[170px] text-right font-medium">{HACKATHON_AVAILABILITY_LABELS[participation.availability]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">Status</dt><dd className="font-medium">{participation.status === "LOOKING" ? "Szukam teamu" : participation.status === "PAUSED" ? "Wstrzymane" : "W teamie"}</dd></div></dl>{participation.status === "LOOKING" && !team ? <div className="mt-3"><PauseHackathonMatchingButton hackathonId={event.id} /></div> : null}{participation.status === "PAUSED" ? <p className="mt-3 text-[12px] leading-5 text-[var(--bc-muted)]">Zapisz formularz ponownie, żeby wrócić do puli.</p> : null}</div> : null}

          {roleCounts.length ? <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Role w puli</p><div className="mt-2 space-y-2">{roleCounts.slice(0, 7).map((row) => <div key={row.role} className="flex items-center justify-between text-[13px]"><span className="text-[var(--bc-muted)]">{ROLE_LABELS[row.role]}</span><span className="font-medium tabular-nums">{row.count}</span></div>)}</div></div> : null}

          <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Oficjalne wydarzenie</p><div className="mt-3 space-y-2"><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">Strona wydarzenia <ExternalLink className="h-3.5 w-3.5" /></a>{event.registrationUrl ? <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">Oficjalne zapisy <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div></div>

          <div className="border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]"><p className="font-medium text-[var(--bc-ink)]">Ważne</p><p className="mt-1">BuildCrew pomaga znaleźć team. Oficjalny udział, regulamin, opłaty i zgody obsługuje organizator. {event.isPartner ? "To wydarzenie jest oznaczone jako partner BuildCrew." : "BuildCrew nie jest oznaczone jako organizator ani oficjalny partner tego wydarzenia."}</p></div>
        </aside>
      </div>
    </div>
  );
}
