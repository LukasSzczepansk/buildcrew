import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/legal-footer";
import { HackathonIdentityMark } from "@/components/hackathons/hackathon-identity-mark";
import { JsonLd } from "@/components/seo/json-ld";
import { ROLE_LABELS } from "@/lib/constants";
import { getHackathonPhase, HACKATHON_PHASE_LABELS, hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import { SITE_URL } from "@/lib/seo";
import { getHackathonBySlug, getHackathonRoleCounts, getHackathonStats } from "@/server/data/hackathons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const event = await getHackathonBySlug(slug);
  if (!event) return { title: "Hackathon — BuildCrew", robots: { index: false, follow: false } };
  const title = `${event.name} — znajdź zespół | BuildCrew`;
  const description = `${event.summary} Znajdź osoby szukające teamu na to samo wydarzenie.`;
  return { title, description, alternates: { canonical: `/hackathony/${event.slug}` }, openGraph: { type: "website", locale: "pl_PL", siteName: "BuildCrew", title, description, url: `/hackathony/${event.slug}` }, twitter: { card: "summary_large_image", title, description }, robots: { index: true, follow: true } };
}

export default async function PublicHackathonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const event = await getHackathonBySlug(slug); if (!event) notFound();
  const [stats, roleCounts] = await Promise.all([getHackathonStats(event.id), getHackathonRoleCounts(event.id)]);
  const phase = getHackathonPhase(event);
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
  return <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]"><JsonLd data={eventJsonLd} /><header className="border-b border-[var(--bc-line)]"><div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" />BuildCrew</Link><div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/hackathony">Hackathony</Link></Button><Button asChild size="sm"><Link href={`/signup?next=/hackathons/${event.slug}`}>Znajdź team</Link></Button></div></div></header><main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10"><Link href="/hackathony" className="text-[13px] font-medium text-[var(--bc-muted)] hover:underline">← Wszystkie hackathony</Link><div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><div><div className="flex gap-4"><HackathonIdentityMark name={event.name} coverImageUrl={event.coverImageUrl} className="h-16 w-16" /><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">{event.name}</h1><Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{HACKATHON_PHASE_LABELS[phase]}</Badge>{event.isPartner ? <Badge variant="outline">Partner BuildCrew</Badge> : null}</div><p className="mt-3 max-w-[760px] text-[15px] leading-6 text-[var(--bc-muted)]">{event.summary}</p></div></div><div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-[var(--bc-line)] py-4 text-[13px]"><span>{hackathonDateLabel(event.startsAt, event.endsAt)}</span><span>{hackathonLocationLabel(event.locationType, event.city)}</span>{event.organizerName ? <span>Organizator: {event.organizerName}</span> : null}</div>{event.description ? <section className="mt-8"><h2 className="text-[18px] font-semibold">O wydarzeniu</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--bc-muted)]">{event.description}</p></section> : null}<section className="mt-8"><h2 className="text-[18px] font-semibold">Kto szuka teamu na BuildCrew</h2><div className="mt-3 border-t border-[var(--bc-line-strong)]">{roleCounts.map((row) => <div key={row.role} className="flex items-center justify-between border-b border-[var(--bc-line)] py-3 text-sm"><span>{ROLE_LABELS[row.role]}</span><span className="font-medium tabular-nums">{row.count}</span></div>)}{!roleCounts.length ? <p className="border-b border-[var(--bc-line)] py-5 text-sm text-[var(--bc-muted)]">Nikt jeszcze nie dołączył do puli tego wydarzenia.</p> : null}</div></section></div><aside className="space-y-5"><div className="border-t border-[var(--bc-line-strong)] pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">BuildCrew Team Finder</p><div className="mt-4 grid grid-cols-3 gap-3"><div><p className="text-[20px] font-semibold">{stats.participantCount}</p><p className="text-[11px] text-[var(--bc-faint)]">uczestników</p></div><div><p className="text-[20px] font-semibold">{stats.lookingCount}</p><p className="text-[11px] text-[var(--bc-faint)]">szuka teamu</p></div><div><p className="text-[20px] font-semibold">{stats.teamCount}</p><p className="text-[11px] text-[var(--bc-faint)]">teamów</p></div></div><Button asChild className="mt-5 w-full"><Link href={`/signup?next=/hackathons/${event.slug}`}>{phase === "TEAM_FORMING" ? "Dołącz do puli" : "Załóż profil BuildCrew"}</Link></Button></div><div className="border-t border-[var(--bc-line)] pt-4"><p className="text-[13px] font-semibold">Oficjalne informacje</p><div className="mt-3 space-y-2"><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-medium hover:underline">Strona wydarzenia <ExternalLink className="h-3.5 w-3.5" /></a>{event.registrationUrl ? <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-medium hover:underline">Rejestracja <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div></div><div className="border-t border-[var(--bc-line)] pt-4 text-[12px] leading-5 text-[var(--bc-muted)]">BuildCrew pomaga użytkownikom znaleźć ekipę. Oficjalna rejestracja, regulamin i zasady udziału należą do organizatora. {event.isPartner ? "Wydarzenie jest oznaczone jako partner BuildCrew." : "BuildCrew nie jest organizatorem ani oficjalnym partnerem tego wydarzenia."}</div></aside></div><LegalFooter className="mt-14" /></main></div>;
}
