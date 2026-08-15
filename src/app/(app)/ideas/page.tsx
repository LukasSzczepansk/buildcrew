import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { IdeaComposer } from "@/components/ideas/idea-composer";
import { IdeaCard } from "@/components/ideas/idea-card";
import { StarterIdeaCard } from "@/components/ideas/starter-idea-card";
import { Avatar } from "@/components/ui/avatar";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { STARTER_IDEAS } from "@/lib/starter-ideas";
import { listIdeas } from "@/server/data/projects";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Pomysły - BuildCrew" };

export default async function IdeasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [ideas, myProfile, builders] = await Promise.all([
    listIdeas(user.id),
    getProfileByUserId(user.id),
    listBuilderProfiles(user.id),
  ]);

  const peopleReadyToBuild = builders
    .filter((builder) => builder.onboardingCompleted && builder.lookingFor.includes("OPEN_TO_BUILD"))
    .sort((a, b) => {
      const aShared = myProfile ? a.interests.filter((interest) => myProfile.interests.includes(interest)).length : 0;
      const bShared = myProfile ? b.interests.filter((interest) => myProfile.interests.includes(interest)).length : 0;
      return bShared - aShared;
    })
    .slice(0, 5);

  const starterIdeas = STARTER_IDEAS.slice(0, Math.max(0, 4 - ideas.length));

  return (
    <div>
      <Topbar title="Pomysły" subtitle="Zacznij od kierunku, znajdź zainteresowanych i dopiero potem zamień go w pełny projekt." />
      <DiscoveryTabs active="ideas" counts={{ ideas: ideas.length, people: peopleReadyToBuild.length }} />

      <section className="mt-6 grid gap-0 border-y border-[var(--bc-line)] lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="py-7 pr-0 lg:pr-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Pomysł → ludzie → projekt</p>
          <h2 className="mt-2 max-w-[720px] text-[27px] font-semibold leading-[1.15] tracking-[-0.035em]">Nie czekaj, aż pomysł będzie kompletny.</h2>
          <p className="mt-3 max-w-[690px] text-sm leading-6 text-[var(--bc-muted)]">W tej sekcji wystarczy opisać problem lub kierunek. Zainteresowane osoby mogą odezwać się jeszcze zanim ustalisz stack, roadmapę czy pełny skład ekipy.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#dodaj-pomysl" className="inline-flex h-9 items-center rounded-[6px] bg-[var(--bc-ink)] px-3.5 text-sm font-medium text-[var(--bc-surface)]">Dodaj pomysł</a>
            <Link href="/build" className="inline-flex h-9 items-center rounded-[6px] border border-[var(--bc-line-strong)] px-3.5 text-sm font-medium">Znajdź ludzi</Link>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-[var(--bc-line)] lg:border-l lg:border-t-0">
          <Stat value={String(ideas.length)} label="pomysłów społeczności" />
          <Stat value={String(peopleReadyToBuild.length)} label="osób otwartych na budowanie" />
          <Stat value="~1 min" label="żeby dodać kierunek" />
        </div>
      </section>

      <div className="mt-6"><IdeaComposer /></div>

      {ideas.length > 0 ? (
        <section className="mt-9">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Pomysły społeczności</h2>
              <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Kliknij „Interesuje mnie”, jeśli chcesz porozmawiać o kierunku bez formalnego zgłoszenia do projektu.</p>
            </div>
            <span className="text-[13px] tabular-nums text-[var(--bc-faint)]">{ideas.length}</span>
          </div>
          <div>{ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} viewerId={user.id} />)}</div>
        </section>
      ) : (
        <section className="mt-9 border-l-2 border-[var(--bc-accent)] pl-4">
          <h2 className="text-[17px] font-semibold">Tu może pojawić się pierwszy prawdziwy pomysł społeczności.</h2>
          <p className="mt-1 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">Nie musisz przygotowywać całego projektu. Wystarczą nazwa, krótki opis i kilka obszarów.</p>
          <a href="#dodaj-pomysl" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium hover:underline">Opublikuj pierwszy <ArrowRight className="h-3.5 w-3.5" /></a>
        </section>
      )}

      {starterIdeas.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Przykładowe kierunki</h2>
              <p className="mt-1 max-w-[720px] text-[13px] leading-5 text-[var(--bc-muted)]">Tak może wyglądać pomysł przed stworzeniem pełnego projektu. Te wpisy są przykładowe i znikają, gdy pojawia się więcej treści społeczności.</p>
            </div>
            <span className="text-[12px] text-[var(--bc-faint)]">Treść demonstracyjna</span>
          </div>
          <div>{starterIdeas.map((idea) => <StarterIdeaCard key={idea.slug} idea={idea} />)}</div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Ludzie, którzy chcą zacząć od ekipy</h2>
            <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Prawdziwi użytkownicy BuildCrew, którzy deklarują, że są otwarci na wspólne budowanie bez gotowego projektu.</p>
          </div>
          <Link href="/build" className="text-[13px] font-medium hover:underline">Build Pool →</Link>
        </div>

        {peopleReadyToBuild.length ? (
          <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {peopleReadyToBuild.map((person) => (
              <Link key={person.userId} href={`/builders/${person.userId}`} className="grid gap-3 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar username={person.username} seed={person.userId} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{person.username}</p>
                    <p className="truncate text-[12px] text-[var(--bc-muted)]">{person.role ? ROLE_LABELS[person.role as RoleType] : "Builder"} · {person.interests.slice(0, 3).join(" · ") || "otwarty na pomysły"}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[13px] font-medium">Zobacz profil →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-y border-[var(--bc-line)] py-6">
            <p className="text-sm font-medium">Na razie nikt z widocznych profili nie wystawił się jako „otwarty na wspólne budowanie”.</p>
            <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Możesz wystawić własny profil w Build Pool i dać innym sygnał, jaki kierunek Cię interesuje.</p>
            <Link href="/build" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium hover:underline">Otwórz Build Pool <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}
      </section>

      <section className="mt-10 border-y border-[var(--bc-line)] py-6">
        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Jak to działa</p>
            <h2 className="mt-1 text-[17px] font-semibold">Od kierunku do ekipy</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Step number="01" title="Dodaj kierunek" text="Opisz problem lub produkt w dwóch zdaniach." />
            <Step number="02" title="Zobacz zainteresowanie" text="Osoby mogą zaznaczyć zainteresowanie bez składania aplikacji." />
            <Step number="03" title="Rozwiń w projekt" text="Gdy kierunek ma sens, przenieś go do pełnego projektu i zaproś ekipę." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-[118px] flex-col justify-center border-r border-[var(--bc-line)] px-4 py-5 last:border-r-0 lg:min-h-0">
      <span className="text-[20px] font-semibold tracking-[-0.02em]">{value}</span>
      <span className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">{label}</span>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="border-l border-[var(--bc-line)] pl-4">
      <p className="text-[11px] font-semibold tabular-nums text-[var(--bc-faint)]">{number}</p>
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">{text}</p>
    </div>
  );
}
