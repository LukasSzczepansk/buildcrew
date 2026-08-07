import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Hammer, Rocket, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">
            🛠️
          </span>
          BuildCrew
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Zacznij budować</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-white to-white dark:from-violet-500/10 dark:via-neutral-950 dark:to-neutral-950" />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" /> Discovery + matching dla builderów
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
            Masz pomysł? Znajdź ludzi i go zbuduj.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-neutral-500 dark:text-neutral-400">
            Poznaj developerów, designerów i innych builderów. Dołącz do projektu albo stwórz ekipę od zera.
            Kontakt wymieniacie na Discordzie — my pomagamy Wam się znaleźć.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Znajdź projekt <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Znajdź ekipę</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <PathCard
            icon={<Rocket className="h-5 w-5" />}
            title="Mam pomysł"
            description="Publikujesz projekt, określasz kogo szukasz, ludzie się zgłaszają, a Ty wybierasz zespół."
          />
          <PathCard
            icon={<Search className="h-5 w-5" />}
            title="Chcę dołączyć"
            description="Pokazujesz swoje umiejętności, przeglądasz projekty i zgłaszasz się do konkretnej roli."
          />
          <PathCard
            icon={<Users className="h-5 w-5" />}
            title="Nie mam pomysłu — chcę coś zbudować"
            description="Trafiasz do Build Pool, poznajesz innych builderów i razem tworzycie ekipę 2–4 osób."
          />
        </div>
      </section>

      <section className="bg-neutral-50 py-20 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">Jak to działa</h2>
          <div className="grid gap-8 sm:grid-cols-4">
            {[
              { step: "1", title: "Tworzysz profil", icon: <Hammer className="h-5 w-5" /> },
              { step: "2", title: "Znajdujesz ludzi", icon: <Search className="h-5 w-5" /> },
              { step: "3", title: "Łączycie się", icon: <Users className="h-5 w-5" /> },
              { step: "4", title: "Budujecie poza platformą", icon: <Rocket className="h-5 w-5" /> },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-neutral-800 dark:text-violet-400">
                  {s.icon}
                </div>
                <p className="text-xs font-semibold text-violet-500">Krok {s.step}</p>
                <p className="mt-1 font-medium">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-10 dark:border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-neutral-400 sm:flex-row">
          <p>© {new Date().getFullYear()} BuildCrew. Znajdź ludzi i zbuduj coś razem.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-neutral-600 dark:hover:text-neutral-200">
              Logowanie
            </Link>
            <Link href="/signup" className="hover:text-neutral-600 dark:hover:text-neutral-200">
              Rejestracja
            </Link>
            <Link href="/regulamin" className="hover:text-neutral-600 dark:hover:text-neutral-200">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:text-neutral-600 dark:hover:text-neutral-200">
              Polityka prywatności
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PathCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}
