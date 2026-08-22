import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HackathonIdentityMark } from "@/components/hackathons/hackathon-identity-mark";
import { LegalFooter } from "@/components/layout/legal-footer";
import { labelsFor } from "@/lib/constants-i18n";
import { hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import { getRequestLocale } from "@/lib/site-server";
import { getHackathonBySlug, getPublicHackathonTeam, teamMissingRoles } from "@/server/data/hackathons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamId: string }> }): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { slug, teamId } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) return { title: "Hackathon team - BuildCrew", robots: { index: false, follow: false } };
  const team = await getPublicHackathonTeam(event.id, teamId);
  if (!team) return { title: `${event.name} - BuildCrew`, robots: { index: false, follow: false } };
  const title = locale === "en" ? `${team.name} is looking for teammates for ${event.name} | BuildCrew` : `${team.name} szuka osób do zespołu na ${event.name} | BuildCrew`;
  const description = locale === "en" ? `${team.members.length}/${team.targetSize} people in the team. See missing roles and join through BuildCrew.` : `${team.members.length}/${team.targetSize} osób w zespole. Zobacz brakujące role i dołącz przez BuildCrew.`;
  return { title, description, robots: { index: false, follow: true }, openGraph: { title, description, type: "website" }, twitter: { card: "summary", title, description } };
}

export default async function PublicHackathonTeamPage({ params }: { params: Promise<{ slug: string; teamId: string }> }) {
  const locale = await getRequestLocale();
  const copy = (pl: string, en: string) => locale === "en" ? en : pl;
  const labels = labelsFor(locale);
  const { slug, teamId } = await params;
  const event = await getHackathonBySlug(slug); if (!event) notFound();
  const team = await getPublicHackathonTeam(event.id, teamId); if (!team) notFound();
  const missing = teamMissingRoles(team.members); const seats = Math.max(0, team.targetSize - team.members.length);
  return <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
    <header className="border-b border-[var(--bc-line)]"><div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" />BuildCrew</Link><Button asChild size="sm"><Link href={`/signup?next=/hackathons/${event.slug}`}>{copy("Znajdź zespół", "Join team finder")}</Link></Button></div></header>
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={`/explore/hackathons/${event.slug}`} className="text-[13px] font-medium text-[var(--bc-muted)] hover:underline">← {event.name}</Link>
      <section className="mt-6 border-y border-[var(--bc-line-strong)] bg-[var(--bc-surface)]"><div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"><div><div className="flex items-start gap-4"><HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-14 w-14" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Zespół na", "Team for")} {event.name}</p><h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">{team.name}</h1><p className="mt-2 text-[14px] text-[var(--bc-muted)]">{hackathonDateLabel(event.startsAt, event.endsAt, locale)} · {hackathonLocationLabel(event.locationType, event.city, locale)}</p></div></div>{team.ideaTitle || team.ideaSummary ? <div className="mt-6 max-w-[720px] border-l-2 border-[var(--bc-accent)] pl-4">{team.ideaTitle ? <p className="text-[15px] font-semibold">{team.ideaTitle}</p> : null}{team.ideaSummary ? <p className="mt-1 text-[14px] leading-6 text-[var(--bc-muted)]">{team.ideaSummary}</p> : null}</div> : null}</div><div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Stan zespołu", "Team status")}</p><div className="mt-3 flex items-baseline gap-2"><span className="text-[32px] font-semibold tabular-nums">{team.members.length}/{team.targetSize}</span><span className="text-[13px] text-[var(--bc-muted)]">{copy("osób", "people")}</span></div>{seats > 0 ? <Badge className="mt-3" variant="default">{seats === 1 ? copy("1 wolne miejsce", "1 open spot") : copy(`${seats} wolne miejsca`, `${seats} open spots`)}</Badge> : <Badge className="mt-3" variant="secondary">{copy("Zespół kompletny", "Team complete")}</Badge>}{seats > 0 ? <Button asChild className="mt-4 w-full"><Link href={`/signup?next=/hackathons/${event.slug}#teams`}>{copy("Chcę dołączyć", "I want to join")} <ArrowRight className="h-3.5 w-3.5" /></Link></Button> : null}</div></div></section>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]"><section><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Zespół", "Team")}</p><div className="mt-2 border-t border-[var(--bc-line-strong)]">{team.members.map((member) => <div key={member.userId} className="flex items-center justify-between gap-4 border-b border-[var(--bc-line)] py-4"><div><p className="text-[14px] font-semibold">{member.publicProfile ? member.username : copy("Członek zespołu", "Team member")}{member.isLead ? <span className="ml-2 text-[11px] font-medium text-[var(--bc-faint)]">{copy("prowadzący", "lead")}</span> : null}</p><p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{member.role ? labels.roles[member.role] : "Builder"}</p></div>{member.publicProfile ? <Link href={`/u/${member.username}`} className="text-[12px] font-medium hover:underline">{copy("Profil", "Profile")} →</Link> : null}</div>)}</div></section><aside><div className="border-t border-[var(--bc-line-strong)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Brakujące role", "Missing roles")}</p>{seats > 0 && missing.length ? <div className="mt-3 flex flex-wrap gap-2">{missing.slice(0, Math.max(2, seats + 1)).map((role) => <span key={role} className="rounded-[5px] border border-[var(--bc-line)] px-2 py-1 text-[12px] font-medium">{labels.roles[role]}</span>)}</div> : <p className="mt-3 text-[13px] text-[var(--bc-muted)]">{copy("Skład jest kompletny albo zespół nie wskazał konkretnej brakującej roli.", "The team is complete or no specific missing role was listed.")}</p>}</div><div className="mt-5 border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]"><p className="font-medium text-[var(--bc-ink)]">{copy("To nie jest oficjalny zapis na wydarzenie.", "This is not official event registration.")}</p><p className="mt-1">{copy("BuildCrew pomaga tylko skompletować ekipę. Udział potwierdzasz u organizatora.", "BuildCrew only helps you form a team. Confirm participation with the event organizer.")}</p><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-medium text-[var(--bc-ink)] hover:underline">{copy("Oficjalna strona", "Official website")} <ExternalLink className="h-3.5 w-3.5" /></a></div></aside></div>
      <LegalFooter className="mt-14" />
    </main>
  </div>;
}
