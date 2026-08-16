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
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { getHackathonPhase, hackathonDateLabel, hackathonLocationLabel, hackathonPhaseLabel } from "@/lib/hackathons";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Find a hackathon team - BuildCrew" : "Find a hackathon team - BuildCrew" };
}

export default async function HackathonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getRequestLocale();
  const copy = (pl: string, en: string) => locale === "en" ? en : pl;
  const labels = labelsFor(locale);
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
    needsCandidates ? listHackathonMatches(event.id, user.id, locale) : Promise.resolve([]),
    listHackathonTeams(event.id, user.id),
    team?.viewerIsLead ? listPendingHackathonTeamRequests(team.id, user.id) : Promise.resolve([]),
  ]);
  const openTeams = teams.filter((item) => item.members.length < item.targetSize);
  const myMissingRoles = team ? teamMissingRoles(team.members) : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/hackathons" className="text-[13px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{copy("← All hackathons", "← All hackathons")}</Link>
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
                  <Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{hackathonPhaseLabel(phase, locale)}</Badge>
                  {event.isPartner ? <Badge variant="outline">BuildCrew partner</Badge> : null}
                </div>
                <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[36px]">{event.name}</h1>
                <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-[var(--bc-muted)]">{event.summary}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-[var(--bc-line)] py-3 text-[13px] text-[var(--bc-muted)]">
              <span className="font-medium text-[var(--bc-ink)]">{hackathonDateLabel(event.startsAt, event.endsAt, locale)}</span>
              <span>{hackathonLocationLabel(event.locationType, event.city, locale)}</span>
              <span>Team {event.minTeamSize}–{event.maxTeamSize} {copy("people", "people")}</span>
              {event.organizerName ? <span>{copy("Organizer", "Organizer")}: {event.organizerName}</span> : null}
            </div>

            {phase === "TEAM_FORMING" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {!team && participation?.status !== "LOOKING" ? <Button asChild><Link href="#join">{copy("I need a team", "I need a team")} <ArrowRight className="h-3.5 w-3.5" /></Link></Button> : null}
                {!team && participation?.status === "LOOKING" ? <SuggestedTeamButton hackathonId={event.id} /> : null}
                {!team && participation?.status === "LOOKING" ? <CreateHackathonTeamForm hackathonId={event.id} minTeamSize={event.minTeamSize} maxTeamSize={event.maxTeamSize} /> : null}
                {team ? <Button asChild><Link href="#my-team">{copy("Your team", "Your team")} · {team.members.length}/{team.targetSize}</Link></Button> : null}
                <Button asChild variant="outline"><Link href="#teams">{copy("Teams looking for people", "Teams looking for people")}</Link></Button>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("BuildCrew pool", "BuildCrew pool")}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><p className="text-[24px] font-semibold tabular-nums">{stats.lookingCount}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">{copy("looking", "looking")}</p></div>
              <div><p className="text-[24px] font-semibold tabular-nums">{stats.teamCount}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">{copy("teams", "teams")}</p></div>
              <div><p className="text-[24px] font-semibold tabular-nums">{openTeams.length}</p><p className="text-[11px] leading-4 text-[var(--bc-faint)]">{copy("open", "open")}</p></div>
            </div>
            <div className="mt-4 border-t border-[var(--bc-line)] pt-3 text-[12px] leading-5 text-[var(--bc-muted)]">
              {team ? <p>{copy("You already have a team. The next step is to fill missing roles and confirm the lineup.", "You already have a team. The next step is to fill missing roles and confirm the lineup.")}</p> : participation?.status === "LOOKING" ? <p>{copy("You are visible in the pool. Browse people and teams or ask BuildCrew to suggest a lineup.", "You are visible in the pool. Browse people and teams or ask BuildCrew to suggest a lineup.")}</p> : <p>{copy("Set your event preferences in about a minute and matching will start immediately.", "Set your event preferences in about a minute and matching will start immediately.")}</p>}
            </div>
          </div>
        </div>

        <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:grid-cols-3">
          <a href="#join" className="px-5 py-3.5 sm:border-r sm:border-[var(--bc-line)]"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">01</p><p className="mt-0.5 text-[13px] font-medium">{copy("Set event profile", "Set event profile")}</p></a>
          <a href="#people" className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-r sm:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">02</p><p className="mt-0.5 text-[13px] font-medium">{copy("Meet matching people", "Meet matching people")}</p></a>
          <a href="#teams" className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">03</p><p className="mt-0.5 text-[13px] font-medium">{copy("Build your team", "Build your team")}</p></a>
        </div>
      </section>

      <div className="grid gap-8 pt-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-9">
          {invites.length && !team ? (
            <section className="border-l-2 border-[var(--bc-accent)] pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Invitations", "Invitations")} · {invites.length}</p>
              <div className="mt-3 space-y-3">{invites.map((invite) => <div key={invite.id} className="flex flex-col gap-3 border-b border-[var(--bc-line)] pb-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[14px] font-semibold">{invite.teamName}</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{invite.inviterUsername} {copy("invited you to the team.", "invited you to the team.")}{invite.message ? ` ${invite.message}` : ""}</p></div><HackathonInviteDecision inviteId={invite.id} /></div>)}</div>
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
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("For you", "For you")}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">{copy("People worth talking to", "People worth talking to")}</h2><p className="mt-1 max-w-[700px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("There is no magic AI score here. The match comes from role, stack, interests, goal and availability.", "There is no magic AI score here. The match comes from role, stack, interests, goal and availability.")}</p></div>
                <SuggestedTeamButton hackathonId={event.id} />
              </div>

              <div className="mt-4 border-t border-[var(--bc-line-strong)]">
                {matches.map((match) => (
                  <article key={match.userId} className="grid gap-4 border-b border-[var(--bc-line)] py-4 lg:grid-cols-[220px_minmax(0,1fr)_120px] lg:items-center">
                    <Link href={`/builders/${match.userId}`} className="flex items-center gap-3"><Avatar username={match.username} seed={match.avatarEmoji || match.userId} size="sm" className="h-10 w-10 text-[12px]" /><div className="min-w-0"><p className="truncate text-[14px] font-semibold">{match.username}</p><p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{labels.roles[match.role]}</p></div></Link>
                    <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Why it may be a good fit", "Why it may be a good fit")}</p><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{match.reasons.slice(0, 2).join(" ") || copy("You are both in the same event pool.", "You are both in the same event pool.")}</p>{match.technologies.length ? <p className="mt-1.5 truncate text-[12px] text-[var(--bc-faint)]">{match.technologies.slice(0, 5).join(" · ")}</p> : null}</div>
                    <div className="flex items-center justify-between gap-3 lg:block lg:text-right"><span className="text-[15px] font-semibold tabular-nums">{match.score}%</span><Button asChild size="sm" variant="outline" className="lg:mt-2"><Link href={`/builders/${match.userId}`}>{copy("Profile", "Profile")}</Link></Button></div>
                  </article>
                ))}
                {!matches.length ? <div className="border-b border-[var(--bc-line)] py-6"><p className="text-[14px] font-medium">{copy("You are one of the first people in this pool.", "You are one of the first people in this pool.")}</p><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{copy("Your event profile will be visible to new participants as they join.", "Your event profile will be visible to new participants as they join.")}</p></div> : null}
              </div>
            </section>
          ) : null}

          {team ? (
            <section id="my-team" className="scroll-mt-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Your team", "Your team")}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">{team.name}</h2><Badge variant={team.members.length >= team.targetSize ? "secondary" : "default"}>{team.members.length}/{team.targetSize}</Badge></div><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{team.ideaTitle || team.ideaSummary || copy("Team for this event.", "Team for this event.")}</p></div>
                <div className="flex flex-wrap gap-2"><HackathonTeamShareButton eventName={event.name} teamName={team.name} sharePath={`/explore/hackathons/${event.slug}/team/${team.id}`} missingRoles={myMissingRoles.slice(0, 2).map((role) => labels.roles[role])} /><LeaveHackathonTeamButton teamId={team.id} /></div>
              </div>

              <div className="mt-4 border-t border-[var(--bc-line-strong)]">
                {team.members.map((member) => <div key={member.userId} className="flex items-center justify-between gap-3 border-b border-[var(--bc-line)] py-3.5"><Link href={`/builders/${member.userId}`} className="flex items-center gap-3"><Avatar username={member.username} seed={member.avatarEmoji || member.userId} size="sm" className="h-10 w-10 text-[12px]" /><div><p className="text-[14px] font-semibold">{member.username}{member.isLead ? <span className="ml-2 text-[11px] font-medium text-[var(--bc-faint)]">{copy("lead", "lead")}</span> : null}</p><p className="text-[12px] text-[var(--bc-muted)]">{member.role ? labels.roles[member.role] : "Builder"}</p></div></Link></div>)}
              </div>

              {team.viewerIsLead && team.members.length < team.targetSize ? (
                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4"><div><p className="text-[13px] font-semibold">{copy("Find", "Find")} {team.targetSize - team.members.length === 1 ? copy("the last person", "the last person") : copy("the missing people", "the missing people")}</p><p className="mt-1 text-[12px] text-[var(--bc-muted)]">{copy("We prioritize roles that complement your current lineup.", "We prioritize roles that complement your current lineup.")}</p></div><span className="text-[12px] text-[var(--bc-faint)]">{team.targetSize - team.members.length} {copy("open", "open")}</span></div>
                  <div className="mt-3 border-t border-[var(--bc-line)]">{matches.slice(0, 6).map((match) => <div key={match.userId} className="grid gap-3 border-b border-[var(--bc-line)] py-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,1fr)_auto] sm:items-center"><div className="flex items-center gap-3"><Avatar username={match.username} seed={match.avatarEmoji || match.userId} size="sm" className="h-9 w-9 text-[11px]" /><div><p className="text-[14px] font-medium">{match.username}</p><p className="text-[12px] text-[var(--bc-muted)]">{labels.roles[match.role]}</p></div></div><p className="text-[12px] leading-5 text-[var(--bc-muted)]">{match.reasons[0] ?? copy("Looking for a team at the same hackathon.", "Looking for a team at the same hackathon.")}</p><InviteHackathonParticipantButton teamId={team.id} inviteeId={match.userId} /></div>)}</div>
                </div>
              ) : null}

              {requests.length ? <div className="mt-6"><p className="text-[13px] font-semibold">{copy("Team requests", "Team requests")} · {requests.length}</p><div className="mt-2 border-t border-[var(--bc-line)]">{requests.map((request) => <div key={request.id} className="flex flex-col gap-3 border-b border-[var(--bc-line)] py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar username={request.username} seed={request.avatarEmoji || request.applicantId} size="sm" className="h-9 w-9 text-[11px]" /><div><p className="text-[14px] font-medium">{request.username}{request.role ? ` · ${labels.roles[request.role]}` : ""}</p><p className="text-[12px] text-[var(--bc-muted)]">{request.message || copy("Wants to join your team.", "Wants to join your team.")}</p></div></div><HackathonRequestDecision requestId={request.id} /></div>)}</div></div> : null}
            </section>
          ) : null}

          <section id="teams" className="scroll-mt-24">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Teams", "Teams")}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">{copy("Teams looking for people", "Teams looking for people")}</h2><p className="mt-1 text-[13px] text-[var(--bc-muted)]">{copy("If you do not want to build a team from scratch, join a team that already has 2/4 or 3/4 members.", "If you do not want to build a team from scratch, join a team that already has 2/4 or 3/4 members.")}</p></div><span className="text-[12px] text-[var(--bc-faint)]">{openTeams.length} {copy("open", "open")}</span></div>
            <div className="mt-3 border-t border-[var(--bc-line-strong)]">
              {openTeams.map((item) => {
                const missing = teamMissingRoles(item.members);
                const seats = item.targetSize - item.members.length;
                return (
                  <article key={item.id} className="grid gap-4 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_230px_auto] sm:items-center">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-semibold">{item.name}</p><span className="text-[12px] font-medium tabular-nums text-[var(--bc-muted)]">{item.members.length}/{item.targetSize}</span></div><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{item.ideaTitle || item.ideaSummary || copy("This team is looking for complementary roles for the event.", "This team is looking for complementary roles for the event.")}</p></div>
                    <div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Missing", "Missing")}</p><p className="mt-1 text-[13px] font-medium">{missing.slice(0, Math.max(1, seats)).map((role) => labels.roles[role]).join(" / ") || `${seats} ${locale === "en" ? (seats === 1 ? "person" : "people") : (seats === 1 ? "people" : "people")}`}</p></div>
                    {team ? <Button asChild size="sm" variant="outline"><Link href={`/explore/hackathons/${event.slug}/team/${item.id}`} target="_blank">{copy("Preview", "Preview")}</Link></Button> : <RequestToJoinTeamButton teamId={item.id} disabled={!participation || participation.status !== "LOOKING" || phase !== "TEAM_FORMING"} alreadyRequested={item.viewerRequestStatus === "PENDING"} />}
                  </article>
                );
              })}
              {!openTeams.length ? <p className="border-b border-[var(--bc-line)] py-6 text-[13px] text-[var(--bc-muted)]">{copy("No public teams are forming yet.", "No public teams are forming yet.")}</p> : null}
            </div>
          </section>

          {event.description ? <section className="border-t border-[var(--bc-line-strong)] pt-6"><h2 className="text-[18px] font-semibold">{copy("About the event", "About the event")}</h2><p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--bc-muted)]">{event.description}</p></section> : null}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {participation ? <div className="border-t border-[var(--bc-line-strong)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Your settings", "Your settings")}</p><dl className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">{copy("Roles", "Roles")}</dt><dd className="font-medium">{labels.roles[participation.role]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">{copy("Goal", "Goal")}</dt><dd className="max-w-[170px] text-right font-medium">{labels.hackathonGoals[participation.goal]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">{copy("Availability", "Availability")}</dt><dd className="max-w-[170px] text-right font-medium">{labels.hackathonAvailability[participation.availability]}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--bc-muted)]">{copy("Status", "Status")}</dt><dd className="font-medium">{participation.status === "LOOKING" ? copy("Looking for a team", "Looking for a team") : participation.status === "PAUSED" ? copy("Paused", "Paused") : copy("In a team", "In a team")}</dd></div></dl>{participation.status === "LOOKING" && !team ? <div className="mt-3"><PauseHackathonMatchingButton hackathonId={event.id} /></div> : null}{participation.status === "PAUSED" ? <p className="mt-3 text-[12px] leading-5 text-[var(--bc-muted)]">{copy("Save the form again to return to the pool.", "Save the form again to return to the pool.")}</p> : null}</div> : null}

          {roleCounts.length ? <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Roles in the pool", "Roles in the pool")}</p><div className="mt-2 space-y-2">{roleCounts.slice(0, 7).map((row) => <div key={row.role} className="flex items-center justify-between text-[13px]"><span className="text-[var(--bc-muted)]">{labels.roles[row.role]}</span><span className="font-medium tabular-nums">{row.count}</span></div>)}</div></div> : null}

          <div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Official event", "Official event")}</p><div className="mt-3 space-y-2"><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">{copy("Event website", "Event website")} <ExternalLink className="h-3.5 w-3.5" /></a>{event.registrationUrl ? <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[13px] font-medium hover:underline">{copy("Official registration", "Official registration")} <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div></div>

          <div className="border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]"><p className="font-medium text-[var(--bc-ink)]">{copy("Important", "Important")}</p><p className="mt-1">{copy("BuildCrew helps you find a team. Official participation, rules, fees and consents are handled by the organizer.", "BuildCrew helps you find a team. Official participation, rules, fees and consents are handled by the organizer.")} {event.isPartner ? copy("This event is marked as a BuildCrew partner.", "This event is marked as a BuildCrew partner.") : copy("BuildCrew is not marked as the organizer or an official partner of this event.", "BuildCrew is not marked as the organizer or an official partner of this event.")}</p></div>
        </aside>
      </div>
    </div>
  );
}
