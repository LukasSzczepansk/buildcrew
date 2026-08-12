import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Hammer, MessageCircle, Rocket, Search, Sparkles, Trophy, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">🛠️</span>
          BuildCrew
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/login">Zaloguj się</Link></Button>
          <Button asChild><Link href="/signup">Znajdź ekipę</Link></Button>
        </div>
      </header>

      {isAiContestActive() ? (
        <div className="mx-auto max-w-6xl px-6 pb-2">
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-violet-50 px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:to-violet-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Trophy className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold">{AI_CONTEST.title} na Discordzie BuildCrew</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">Trwa do {AI_CONTEST.deadlineLabel}. Dołącz do społeczności i sprawdź aktualne szczegóły oraz zasady na serwerze.</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">Dołącz na Discord <ExternalLink className="h-3.5 w-3.5" /></span>
          </a>
        </div>
      ) : null}

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-white to-white dark:from-violet-500/10 dark:via-neutral-950 dark:to-neutral-950" />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center sm:py-28">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" /> Współtwórcy zamiast zleceń
          </span>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
            Znajdź ludzi. Zbierz ekipę. <span className="text-violet-600 dark:text-violet-400">Zbudujcie coś razem.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
            BuildCrew pomaga znaleźć osoby do wspólnego tworzenia aplikacji, stron, projektów do portfolio, open source i potencjalnych startupów. Nie musisz mieć gotowego pomysłu.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900">bez opłat za znalezienie ekipy</span>
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900">bez rekrutacji pracowników</span>
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900">bez marketplace&apos;u freelancerów</span>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">Znajdź ludzi do budowania <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline"><Link href="/signup">Zobacz projekty</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Zacznij tak, jak Ci wygodnie</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Projekt nie jest wymagany na start</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <PathCard icon={<Rocket className="h-5 w-5" />} title="Mam pomysł" description="Opisz kierunek i znajdź osoby, które chcą rozwijać go razem z Tobą — jako współtwórcy." />
          <PathCard icon={<Search className="h-5 w-5" />} title="Chcę dołączyć" description="Przeglądaj projekty i dołącz do ekipy, której cel, tempo i technologia naprawdę Ci odpowiadają." />
          <PathCard icon={<Users className="h-5 w-5" />} title="Nie mam pomysłu" description="Wejdź do Build Pool, znajdź kompatybilnych builderów i dopiero razem zdecydujcie, co chcecie stworzyć." />
        </div>
      </section>

      <section className="bg-neutral-50 py-16 dark:bg-neutral-900/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Ważne rozróżnienie</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Szukasz współtwórcy, nie wykonawcy.</h2>
            <p className="mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">
              BuildCrew ma łączyć ludzi, którzy chcą razem eksperymentować, uczyć się, budować portfolio albo spróbować stworzyć coś większego. To nie jest tablica płatnych zleceń.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CompareItem good={false}>„Zrób mi aplikację za X zł”</CompareItem>
            <CompareItem good>„Zbudujmy to razem”</CompareItem>
            <CompareItem good={false}>Klient i wykonawca</CompareItem>
            <CompareItem good>Współtwórcy i ekipa</CompareItem>
            <CompareItem good={false}>CV i rekrutacja</CompareItem>
            <CompareItem good>Profil, intencja i dopasowanie</CompareItem>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-violet-200 bg-violet-50/70 p-8 dark:border-violet-500/20 dark:bg-violet-500/5 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300"><Users className="h-4 w-4" /> Build Pool</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">„Chcę coś zbudować, tylko nie wiem jeszcze z kim ani co.”</h2>
              <p className="mt-4 text-neutral-600 dark:text-neutral-300">To wystarczy. Wystaw siebie, określ rolę, technologie, dostępność i kierunek zainteresowań. BuildCrew pokaże Ci osoby, z którymi możesz dobrze się uzupełniać.</p>
              <Button asChild className="mt-6 gap-2"><Link href="/signup">Znajdź swoją ekipę <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid gap-3">
              {["Podobne zainteresowania", "Uzupełniające się role", "Zbliżona dostępność", "Podobny cel współpracy"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-medium shadow-sm dark:bg-neutral-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Check className="h-4 w-4" /></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-20 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">Jak to działa</h2>
          <div className="grid gap-8 sm:grid-cols-4">
            {[
              { step: "1", title: "Pokazujesz, kim jesteś", icon: <Hammer className="h-5 w-5" /> },
              { step: "2", title: "Znajdujesz kompatybilnych ludzi", icon: <Search className="h-5 w-5" /> },
              { step: "3", title: "Tworzycie ekipę", icon: <Users className="h-5 w-5" /> },
              { step: "4", title: "Budujecie coś wspólnie", icon: <Rocket className="h-5 w-5" /> },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-neutral-800 dark:text-violet-400">{s.icon}</div>
                <p className="text-xs font-semibold text-violet-500">Krok {s.step}</p>
                <p className="mt-1 font-medium">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-10 dark:border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-neutral-400 sm:flex-row">
          <p>© {new Date().getFullYear()} BuildCrew. Znajdź ludzi i zbudujcie coś razem.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-neutral-600 dark:hover:text-neutral-200">Logowanie</Link>
            <Link href="/signup" className="hover:text-neutral-600 dark:hover:text-neutral-200">Rejestracja</Link>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-violet-600"><MessageCircle className="h-3.5 w-3.5" /> Discord</a>
            <Link href="/regulamin" className="hover:text-neutral-600 dark:hover:text-neutral-200">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-neutral-600 dark:hover:text-neutral-200">Polityka prywatności</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PathCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function CompareItem({ good, children }: { good: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      <span className={good ? "text-emerald-600" : "text-neutral-400"}>{good ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
      <span className={good ? "font-medium" : "text-neutral-500 line-through decoration-neutral-300 dark:text-neutral-400"}>{children}</span>
    </div>
  );
}
