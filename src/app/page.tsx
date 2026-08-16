import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listPublicProjectsForLanding } from "@/server/data/projects";

const COPY = {
  pl: {
    title: "BuildCrew - projekty do portfolio i ludzie do wspólnego budowania",
    description: "Znajdź ludzi do projektu, zbudujcie coś razem i twórz historię realnej współpracy. Projekty do portfolio, zespoły i sieć builderów w jednym miejscu.",
    projects: "Projekty", hackathons: "Hackathony", how: "Jak działa", forWho: "Dla kogo", login: "Zaloguj", signup: "Załóż konto",
    eyebrow: "Projekty cyfrowe · ludzie · współpraca", hero1: "Znajdź ludzi.", hero2: "Zróbcie projekt.",
    heroBody: "BuildCrew pomaga programistom, designerom i product builderom znaleźć ekipę do projektu, zbudować coś razem i zachować historię realnej współpracy. Bez ofert pracy i bez udawania rekrutacji.",
    seeProjects: "Zobacz projekty", createProfile: "Załóż profil", current: "Aktualne projekty", seeAll: "Zobacz wszystkie",
    communityProject: "Projekt społecznościowy", completeTeam: "ekipa kompletna", noProjects: "Pierwsze publiczne projekty pojawią się tutaj po publikacji.",
    canStart: "Możesz zacząć bez projektu.", entry: "Wybierz punkt wejścia.",
    startRows: [
      ["Mam projekt", "Opisz kierunek, etap i role, których potrzebujesz."],
      ["Chcę dołączyć", "Przeglądaj projekty po technologii, roli i czasie."],
      ["Szukam ludzi", "Znajdź osoby o pasującym profilu i zacznij rozmowę."],
      ["Jadę na hackathon", "Wybierz wydarzenie, dołącz do puli i znajdź team z uzupełniającymi się rolami."],
    ],
    howTitle: "Jak to działa", minimum: "Minimum procesu.",
    processRows: [
      ["Uzupełnij profil", "Rola, umiejętności, dostępność i to, co chcesz budować."],
      ["Znajdź właściwy kontekst", "Projekt albo osoba. Filtry i dopasowanie pomagają zawęzić wybór."],
      ["Porozmawiajcie", "Ustalcie zakres, tempo i odpowiedzialność bez dodatkowego workflow."],
      ["Budujcie i zostawcie ślad", "Wspólne projekty budują historię współpracy, portfolio i sieć ludzi, z którymi naprawdę pracowałeś."],
    ],
    closing: "Nie zbieraj kontaktów. Buduj sieć ludzi, z którymi naprawdę coś zrobiłeś.",
    terms: "Regulamin", privacy: "Prywatność", auth: "Logowanie", until: "do",
  },
  en: {
    title: "BuildCrew - find people to build projects with",
    description: "Find people for your project, build together and create a track record of real collaboration. Projects, teams and builders in one place.",
    projects: "Projects", hackathons: "Hackathons", how: "How it works", forWho: "For builders", login: "Log in", signup: "Create account",
    eyebrow: "Digital projects · people · collaboration", hero1: "Find your people.", hero2: "Build something real.",
    heroBody: "BuildCrew helps developers, designers and product builders find teammates, build projects together and create a track record of real collaboration. No job listings and no fake recruiting process.",
    seeProjects: "Explore projects", createProfile: "Create profile", current: "Projects looking for people", seeAll: "See all",
    communityProject: "Community project", completeTeam: "team complete", noProjects: "Public projects will appear here as soon as builders publish them.",
    canStart: "You can start without a project.", entry: "Choose your way in.",
    startRows: [
      ["I have a project", "Describe the direction, stage and roles you need."],
      ["I want to join", "Browse projects by technology, role and weekly commitment."],
      ["I'm looking for people", "Find builders with a matching profile and start a conversation."],
      ["I'm joining a hackathon", "Pick an event, join the pool and find teammates with complementary roles."],
    ],
    howTitle: "How it works", minimum: "Just enough process.",
    processRows: [
      ["Complete your profile", "Add your role, skills, availability and what you want to build."],
      ["Find the right context", "A project or a person. Filters and matching help narrow the choice."],
      ["Talk", "Agree on scope, pace and ownership without another heavy workflow."],
      ["Build and leave a track record", "Shared projects create collaboration history, portfolio proof and a network of people you actually worked with."],
    ],
    closing: "Don't collect contacts. Build a network of people you've actually shipped things with.",
    terms: "Terms", privacy: "Privacy", auth: "Login", until: "until",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: siteUrlForLocale(locale) },
    openGraph: { type: "website", locale: openGraphLocale(locale), siteName: "BuildCrew", title: copy.title, description: copy.description, url: siteUrlForLocale(locale) },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  const featuredProjects = await listPublicProjectsForLanding(3);
  const copy = COPY[locale];
  const labels = labelsFor(locale);
  const publicProjectsHref = locale === "en" ? "/explore/projects" : "/projekty";
  const publicHackathonsHref = locale === "en" ? "/explore/hackathons" : "/hackathony";
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildCrew",
    url: siteUrlForLocale(locale),
    description: copy.description,
    inLanguage: localeCode(locale),
  };

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <JsonLd data={websiteJsonLd} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew</Link>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex dark:text-neutral-400">
            <Link href={publicProjectsHref} className="hover:text-neutral-950 hover:underline dark:hover:text-white">{copy.projects}</Link>
            <Link href={publicHackathonsHref} className="hover:text-neutral-950 hover:underline dark:hover:text-white">{copy.hackathons}</Link>
            <a href="#jak-to-dziala" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{copy.how}</a>
            <a href="#dla-kogo" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{copy.forWho}</a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Discord</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <Button asChild variant="ghost" size="sm"><Link href="/login">{copy.login}</Link></Button>
            <Button asChild size="sm"><Link href="/signup">{copy.signup}</Link></Button>
          </div>
        </div>
      </header>

      {isAiContestActive() ? <div className="border-b border-[#d8d8d0] bg-[#efefe9] dark:border-[#34342f] dark:bg-[#151513]"><a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-2.5 text-[12px] sm:px-8 lg:px-10"><span><strong className="font-semibold">{AI_CONTEST.title}</strong> · {copy.until} {AI_CONTEST.deadlineLabel}</span><span className="inline-flex items-center gap-1 text-neutral-500">Discord <ExternalLink className="h-3 w-3" /></span></a></div> : null}

      <main>
        <section className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end lg:px-10 lg:py-24">
          <div>
            <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{copy.eyebrow}</p>
            <h1 className="mt-5 max-w-[760px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">{copy.hero1}<br />{copy.hero2}</h1>
            <p className="mt-6 max-w-xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">{copy.heroBody}</p>
            <div className="mt-7 flex flex-wrap gap-2"><Button asChild size="lg"><Link href={publicProjectsHref}>{copy.seeProjects} <ArrowRight className="h-3.5 w-3.5" /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/signup">{copy.createProfile}</Link></Button></div>
          </div>

          <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
            <div className="flex items-center justify-between border-b border-[#d8d8d0] py-3 text-[12px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"><span>{copy.current}</span><Link href={publicProjectsHref} className="hover:text-neutral-950 hover:underline dark:hover:text-white">{copy.seeAll}</Link></div>
            {featuredProjects.length ? featuredProjects.map((project) => {
              const roles = project.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType]).join(" + ");
              const stack = project.technologies.slice(0, 3).join(" · ") || copy.communityProject;
              return <PreviewRow key={project.id} href={`/p/${project.id}`} name={project.name} meta={`${labels.stages[project.stage]} · ${roles || copy.completeTeam}`} stack={stack} />;
            }) : <div className="border-b border-[#d8d8d0] py-5 text-[13px] leading-5 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{copy.noProjects}</div>}
          </div>
        </section>

        <section id="dla-kogo" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]"><div className="mx-auto grid max-w-[1240px] px-5 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10"><div className="border-b border-[#d8d8d0] py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-10 dark:border-neutral-700"><p className="text-[13px] font-medium text-neutral-500">{copy.canStart}</p><h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.025em]">{copy.entry}</h2></div><div className="lg:pl-10">{copy.startRows.map(([title, text], index) => <StartRow key={title} index={`0${index + 1}`} title={title} text={text} />)}</div></div></section>

        <section id="jak-to-dziala" className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10"><div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]"><div><p className="text-[13px] font-medium text-neutral-500">{copy.howTitle}</p><h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">{copy.minimum}</h2></div><ol className="border-t border-[#b9b9b1] dark:border-neutral-600">{copy.processRows.map(([title, text], index) => <ProcessRow key={title} number={String(index + 1)} title={title} text={text} />)}</ol></div></section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100"><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10"><div><p className="text-[13px] text-neutral-400">BuildCrew</p><h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">{copy.closing}</h2></div><Button asChild variant="secondary" size="lg"><Link href="/signup">{copy.signup}</Link></Button></div></section>
      </main>

      <footer className="border-t border-[#d8d8d0] dark:border-[#34342f]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-[12px] text-neutral-500 sm:flex-row sm:items-center sm:px-8 lg:px-10"><p>© {new Date().getFullYear()} BuildCrew</p><div className="flex flex-wrap gap-5"><Link href={publicProjectsHref} className="hover:underline">{copy.projects}</Link><Link href={publicHackathonsHref} className="hover:underline">{copy.hackathons}</Link><Link href={locale === "en" ? "/terms" : "/regulamin"} className="hover:underline">{copy.terms}</Link><Link href={locale === "en" ? "/privacy" : "/polityka-prywatnosci"} className="hover:underline">{copy.privacy}</Link><a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">Discord</a><Link href="/login" className="hover:underline">{copy.auth}</Link></div></div></footer>
    </div>
  );
}

function PreviewRow({ href, name, meta, stack }: { href: string; name: string; meta: string; stack: string }) { return <Link href={href} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d8d8d0] py-4 transition-colors hover:bg-black/[0.025] dark:border-neutral-700 dark:hover:bg-white/[0.03]"><div><p className="text-[14px] font-semibold tracking-[-0.01em]">{name}</p><p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{meta}</p></div><p className="max-w-[190px] self-end text-right text-[12px] text-neutral-500 dark:text-neutral-400">{stack}</p></Link>; }
function StartRow({ index, title, text }: { index: string; title: string; text: string }) { return <div className="grid gap-2 border-b border-[#d8d8d0] py-7 last:border-b-0 sm:grid-cols-[42px_180px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700"><span className="text-[12px] tabular-nums text-neutral-400">{index}</span><h3 className="text-[15px] font-semibold">{title}</h3><p className="max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></div>; }
function ProcessRow({ number, title, text }: { number: string; title: string; text: string }) { return <li className="grid gap-2 border-b border-[#d8d8d0] py-5 sm:grid-cols-[34px_190px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700"><span className="text-[12px] tabular-nums text-neutral-400">{number}</span><h3 className="text-[14px] font-semibold">{title}</h3><p className="max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></li>; }
