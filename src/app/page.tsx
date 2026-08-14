import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_URL } from "@/lib/seo";
import { listPublicProjectsForLanding } from "@/server/data/projects";

export const metadata: Metadata = {
  title: DEFAULT_SEO_TITLE,
  description: DEFAULT_SEO_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "BuildCrew",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  const featuredProjects = await listPublicProjectsForLanding(3);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildCrew",
    url: SITE_URL,
    description: DEFAULT_SEO_DESCRIPTION,
    inLanguage: "pl-PL",
  };

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <JsonLd data={websiteJsonLd} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />
            BuildCrew
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-neutral-600 md:flex dark:text-neutral-400">
            <Link href="/projekty" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Projekty</Link>
            <a href="#jak-to-dziala" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Jak działa</a>
            <a href="#dla-kogo" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Dla kogo</a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Discord</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Zaloguj</Link></Button>
            <Button asChild size="sm"><Link href="/signup">Załóż konto</Link></Button>
          </div>
        </div>
      </header>

      {isAiContestActive() ? (
        <div className="border-b border-[#d8d8d0] bg-[#efefe9] dark:border-[#34342f] dark:bg-[#151513]">
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-2.5 text-[11px] sm:px-8 lg:px-10">
            <span><strong className="font-semibold">{AI_CONTEST.title}</strong> · do {AI_CONTEST.deadlineLabel}</span>
            <span className="inline-flex items-center gap-1 text-neutral-500">Discord <ExternalLink className="h-3 w-3" /></span>
          </a>
        </div>
      ) : null}

      <main>
        <section className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end lg:px-10 lg:py-24">
          <div>
            <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Projekty cyfrowe · ludzie · współpraca</p>
            <h1 className="mt-5 max-w-[760px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">
              Znajdź ludzi.<br />Zróbcie projekt.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">
              BuildCrew pomaga programistom, designerom i product builderom znaleźć sensowny projekt albo osobę do współpracy. Bez ofert pracy i bez udawania rekrutacji.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild size="lg"><Link href="/projekty">Zobacz projekty <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/signup">Załóż profil</Link></Button>
            </div>
          </div>

          <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
            <div className="flex items-center justify-between border-b border-[#d8d8d0] py-3 text-[11px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              <span>Aktualne projekty</span>
              <Link href="/projekty" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Zobacz wszystkie</Link>
            </div>
            {featuredProjects.length ? featuredProjects.map((project) => {
              const roles = project.openRoles.slice(0, 2).map((role) => ROLE_LABELS[role.roleType]).join(" + ");
              const stack = project.technologies.slice(0, 3).join(" · ") || "Projekt społecznościowy";
              return (
                <PreviewRow
                  key={project.id}
                  href={`/p/${project.id}`}
                  name={project.name}
                  meta={`${STAGE_LABELS[project.stage]} · ${roles || "ekipa kompletna"}`}
                  stack={stack}
                />
              );
            }) : (
              <div className="border-b border-[#d8d8d0] py-5 text-[12px] leading-5 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                Pierwsze publiczne projekty pojawią się tutaj po publikacji.
              </div>
            )}
          </div>
        </section>

        <section id="dla-kogo" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto grid max-w-[1240px] px-5 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
            <div className="border-b border-[#d8d8d0] py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-10 dark:border-neutral-700">
              <p className="text-[12px] font-medium text-neutral-500">Możesz zacząć bez projektu.</p>
              <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.025em]">Wybierz punkt wejścia.</h2>
            </div>
            <div className="lg:pl-10">
              <StartRow index="01" title="Mam projekt" text="Opisz kierunek, etap i role, których potrzebujesz." />
              <StartRow index="02" title="Chcę dołączyć" text="Przeglądaj projekty po technologii, roli i czasie." />
              <StartRow index="03" title="Szukam ludzi" text="Znajdź osoby o pasującym profilu i zacznij rozmowę." />
            </div>
          </div>
        </section>

        <section id="jak-to-dziala" className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-[12px] font-medium text-neutral-500">Jak to działa</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">Minimum procesu.</h2>
            </div>
            <ol className="border-t border-[#b9b9b1] dark:border-neutral-600">
              <ProcessRow number="1" title="Uzupełnij profil" text="Rola, umiejętności, dostępność i to, co chcesz budować." />
              <ProcessRow number="2" title="Znajdź właściwy kontekst" text="Projekt albo osoba. Filtry i dopasowanie pomagają zawęzić wybór." />
              <ProcessRow number="3" title="Porozmawiajcie" text="Ustalcie zakres, tempo i odpowiedzialność bez dodatkowego workflow." />
              <ProcessRow number="4" title="Budujcie" text="Projekt jest środkiem do zdobycia doświadczenia i stworzenia czegoś realnego." />
            </ol>
          </div>
        </section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100">
          <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10">
            <div>
              <p className="text-[12px] text-neutral-400">BuildCrew</p>
              <h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">
                Mniej profili do oglądania. Więcej powodów, żeby zacząć razem coś robić.
              </h2>
            </div>
            <Button asChild variant="secondary" size="lg"><Link href="/signup">Załóż konto</Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-[11px] text-neutral-500 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} BuildCrew</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/projekty" className="hover:underline">Projekty</Link>
            <Link href="/regulamin" className="hover:underline">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="hover:underline">Prywatność</Link>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">Discord</a>
            <Link href="/login" className="hover:underline">Logowanie</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PreviewRow({ href, name, meta, stack }: { href: string; name: string; meta: string; stack: string }) {
  return (
    <Link href={href} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d8d8d0] py-4 transition-colors hover:bg-black/[0.025] dark:border-neutral-700 dark:hover:bg-white/[0.03]">
      <div>
        <p className="text-[14px] font-semibold tracking-[-0.01em]">{name}</p>
        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{meta}</p>
      </div>
      <p className="max-w-[190px] self-end text-right text-[11px] text-neutral-500 dark:text-neutral-400">{stack}</p>
    </Link>
  );
}

function StartRow({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="grid gap-2 border-b border-[#d8d8d0] py-7 last:border-b-0 sm:grid-cols-[42px_180px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700">
      <span className="text-[11px] tabular-nums text-neutral-400">{index}</span>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="max-w-xl text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  );
}

function ProcessRow({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="grid gap-2 border-b border-[#d8d8d0] py-5 sm:grid-cols-[34px_190px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700">
      <span className="text-[11px] tabular-nums text-neutral-400">{number}</span>
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <p className="max-w-xl text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">{text}</p>
    </li>
  );
}
