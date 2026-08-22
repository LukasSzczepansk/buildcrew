import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labelsFor } from "@/lib/constants-i18n";
import { getHackathonPhase, HACKATHON_PHASE_LABELS, HACKATHON_PHASE_LABELS_EN, hackathonDateLabel, hackathonLocationLabel } from "@/lib/hackathons";
import { getRequestLocale } from "@/lib/site-server";
import { getHackathonOrganizerSnapshot } from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Team Finder - Admin BuildCrew" };

export default async function HackathonOrganizerSnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const en = locale === "en";
  const snapshot = await getHackathonOrganizerSnapshot(id);
  if (!snapshot) notFound();

  const { event, stats, roleCounts, teams } = snapshot;
  const phase = getHackathonPhase(event);
  const labels = labelsFor(locale);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/hackathons" className="text-[12px] font-medium text-[var(--bc-muted)] hover:underline">← {en ? "Hackathons" : "Hackathony"}</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-[24px] font-semibold tracking-[-0.025em]">{event.name}</h2>
            <Badge variant={phase === "TEAM_FORMING" ? "default" : "secondary"}>{en ? HACKATHON_PHASE_LABELS_EN[phase] : HACKATHON_PHASE_LABELS[phase]}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-[var(--bc-muted)]">{en ? "A team-matching overview you can show to an organizer without exposing private messages." : "Podgląd dobierania zespołów, który możesz pokazać organizatorowi bez ujawniania prywatnych wiadomości."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link href={`/explore/hackathons/${event.slug}`} target="_blank">{en ? "Public view" : "Widok publiczny"} <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
          <Button asChild size="sm"><Link href={`/hackathons/${event.slug}`} target="_blank">{en ? "Participant view" : "Widok uczestnika"} <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Organizer snapshot" : "Podgląd dla organizatora"}</p>
            <h3 className="mt-1 text-[20px] font-semibold">{en ? "Are participants actually forming teams?" : "Czy uczestnicy faktycznie tworzą zespoły?"}</h3>
            <p className="mt-1 text-[13px] text-[var(--bc-muted)]">{hackathonDateLabel(event.startsAt, event.endsAt, locale)} · {hackathonLocationLabel(event.locationType, event.city, locale)}</p>
          </div>
          <div className="text-[12px] text-[var(--bc-muted)]">{en ? "Short link" : "Krótki link"}: <span className="font-medium text-[var(--bc-ink)]">/h/{event.slug}</span></div>
        </div>
        <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:grid-cols-5">
          {[
            [en ? "Participants" : "Uczestnicy", stats.participantCount],
            [en ? "Looking for a team" : "Szuka zespołu", stats.lookingCount],
            [en ? "Teams" : "Zespoły", stats.teamCount],
            [en ? "Open" : "Otwarte", stats.openTeamCount],
            [en ? "Full" : "Kompletne", stats.fullTeamCount],
          ].map(([label, value], index) => <div key={String(label)} className={`px-4 py-4 ${index ? "border-t border-[var(--bc-line)] sm:border-l sm:border-t-0" : ""}`}><p className="text-[24px] font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-[11px] text-[var(--bc-faint)]">{label}</p></div>)}
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside>
          <div className="border-t border-[var(--bc-line-strong)] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Roles in the pool" : "Role w puli"}</p>
            <div className="mt-2 space-y-2">
              {roleCounts.map((row) => <div key={row.role} className="flex items-center justify-between text-[13px]"><span className="text-[var(--bc-muted)]">{labels.roles[row.role]}</span><span className="font-semibold tabular-nums">{row.count}</span></div>)}
              {!roleCounts.length ? <p className="text-[13px] text-[var(--bc-muted)]">{en ? "The pool is still empty." : "Pula jest jeszcze pusta."}</p> : null}
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--bc-line)] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Partner-ready view" : "Widok dla partnera"}</p>
            <p className="mt-2 text-[12px] leading-5 text-[var(--bc-muted)]">{en ? "This screen intentionally shows counts, team composition, and missing roles - without message content or private conversations." : "Ten ekran celowo pokazuje liczby, skład zespołów i brakujące role - bez treści wiadomości i prywatnych rozmów."}</p>
          </div>
        </aside>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Teams" : "Zespoły"}</p><h3 className="mt-1 text-[18px] font-semibold">{en ? "Team formation status" : "Stan tworzenia zespołów"}</h3></div>
            <span className="text-[12px] text-[var(--bc-faint)]">{teams.length} {en ? "total" : "łącznie"}</span>
          </div>
          <div className="mt-3 border-t border-[var(--bc-line-strong)]">
            {teams.map((team) => (
              <div key={team.id} className="grid gap-3 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_120px_220px] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-semibold">{team.name}</p><span className="text-[12px] font-medium tabular-nums text-[var(--bc-muted)]">{team.members.length}/{team.targetSize}</span></div>
                  <p className="mt-1 text-[12px] text-[var(--bc-muted)]">{team.ideaTitle || team.ideaSummary || (en ? "No idea description" : "Brak opisu pomysłu")}</p>
                </div>
                <div><p className="text-[11px] uppercase tracking-[0.06em] text-[var(--bc-faint)]">{en ? "Open seats" : "Wolne miejsca"}</p><p className="mt-1 text-[13px] font-medium">{team.missingSeats}</p></div>
                <div><p className="text-[11px] uppercase tracking-[0.06em] text-[var(--bc-faint)]">{en ? "May be missing" : "Może brakować"}</p><p className="mt-1 text-[13px] font-medium">{team.missingSeats ? team.missingRoles.slice(0, 2).map((role) => labels.roles[role]).join(" / ") || (en ? "any role" : "dowolnej roli") : (en ? "team complete" : "zespół kompletny")}</p></div>
              </div>
            ))}
            {!teams.length ? <p className="border-b border-[var(--bc-line)] py-6 text-[13px] text-[var(--bc-muted)]">{en ? "No teams have been created yet." : "Nie utworzono jeszcze żadnego zespołu."}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
