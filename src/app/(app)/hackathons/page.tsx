import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { HackathonCard } from "@/components/hackathons/hackathon-card";
import { Button } from "@/components/ui/button";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
import { listPublishedHackathons } from "@/server/data/hackathons";

export const metadata: Metadata = { title: "Hackathony — BuildCrew" };

function eventWord(count: number) {
  if (count === 1) return "hackathon";
  if (count >= 2 && count <= 4) return "hackathony";
  return "hackathonów";
}

function peopleWord(count: number) {
  if (count === 1) return "osoba";
  if (count >= 2 && count <= 4) return "osoby";
  return "osób";
}

function teamWord(count: number) {
  if (count === 1) return "zespół";
  if (count >= 2 && count <= 4) return "zespoły";
  return "zespołów";
}

export default async function HackathonsPage() {
  const events = await listPublishedHackathons();
  const lookingCount = events.reduce((sum, event) => sum + event.lookingCount, 0);
  const teamCount = events.reduce((sum, event) => sum + event.teamCount, 0);

  const headline = lookingCount > 0
    ? `${lookingCount} ${peopleWord(lookingCount)} szuka teamu na ${events.length} ${eventWord(events.length)}.`
    : events.length > 0
      ? `Masz ${events.length} ${eventWord(events.length)} do sprawdzenia. Znajdź wydarzenie i zacznij kompletować ekipę.`
      : "Nowe hackathony pojawią się tutaj, gdy tylko je zweryfikujemy.";

  return (
    <div>
      <Topbar
        title="Hackathony"
        subtitle="Znajdź ludzi na to samo wydarzenie, skompletuj brakujące role albo pozwól BuildCrew zaproponować skład."
      />

      <div className="mb-5">
        <DiscoveryTabs active="hackathons" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">Na teraz</p>
            <h2 className="mt-2 max-w-[820px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">
              {headline}
            </h2>
            <p className="mt-2 max-w-[760px] text-[13px] leading-5 text-[var(--bc-muted)]">
              BuildCrew pomaga znaleźć team — rejestracja na samo wydarzenie nadal odbywa się po stronie organizatora.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm">
              <Link href="#nadchodzace"><UsersRound className="h-3.5 w-3.5" /> Znajdź team</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/hackathony" target="_blank">Publiczny katalog <ExternalLink className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>

        <div className="grid border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:grid-cols-3">
          <div className="px-5 py-3.5 sm:border-r sm:border-[var(--bc-line)] md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">01 · Wydarzenie</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">Wybierz hackathon, na który faktycznie jedziesz.</p>
          </div>
          <div className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-r sm:border-t-0 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">02 · Profil</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">Ustaw rolę, stack, zainteresowania i dostępność.</p>
          </div>
          <div className="border-t border-[var(--bc-line)] px-5 py-3.5 sm:border-t-0 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">03 · Team</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">Znajdź ludzi sam albo sprawdź proponowany skład.</p>
          </div>
        </div>
      </section>

      <section id="nadchodzace" className="mt-8 scroll-mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.018em]">Nadchodzące i aktywne</h2>
            <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Wybierz wydarzenie i zobacz ludzi, którzy też szukają ekipy.</p>
          </div>
          <div className="hidden items-center gap-5 text-[12px] tabular-nums text-[var(--bc-faint)] sm:flex">
            <span>{events.length} {eventWord(events.length)}</span>
            {lookingCount > 0 ? <span>{lookingCount} szuka teamu</span> : null}
            {teamCount > 0 ? <span>{teamCount} {teamWord(teamCount)}</span> : null}
          </div>
        </div>

        <div className="mt-3 border-t border-[var(--bc-line-strong)]">
          {events.map((event) => (
            <HackathonCard key={event.id} event={event} href={`/hackathons/${event.slug}`} />
          ))}
        </div>

        {!events.length ? (
          <div className="border-b border-[var(--bc-line)] py-8">
            <p className="text-[15px] font-medium">Brak opublikowanych hackathonów.</p>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[var(--bc-muted)]">
              Dodajemy tylko wydarzenia, które udało się zweryfikować. Gdy pojawią się kolejne, zobaczysz je tutaj.
            </p>
          </div>
        ) : null}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-5 text-[12px] text-[var(--bc-muted)]">
        <span>Nie widzisz wydarzenia, na które jedziesz?</span>
        <Link href="/help/new" className="inline-flex items-center gap-1.5 font-medium text-[var(--bc-ink)] hover:underline">
          Daj nam znać <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
