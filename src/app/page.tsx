import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { countryLabel } from "@/lib/countries";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listPublicProjectsForLanding } from "@/server/data/projects";
import { listPublicBuildersForLanding } from "@/server/data/profiles";

const SEO = {
  pl: {
    title: "BuildCrew — znajdź programistę, designera lub zespół do projektu",
    description: "Znajdź programistów, designerów, marketerów i innych ludzi do wspólnego tworzenia projektów. Dodaj projekt lub dołącz do istniejącego zespołu.",
  },
  en: {
    title: "BuildCrew - professional network for people who build",
    description: "Find teammates, co-founders and collaborators, showcase what you build, grow your professional network and get discovered for new opportunities.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: siteUrlForLocale(locale) },
    openGraph: { type: "website", locale: openGraphLocale(locale), siteName: "BuildCrew", title: seo.title, description: seo.description, url: siteUrlForLocale(locale) },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  const locale = await getRequestLocale();
  const en = locale === "en";
  const c = <T,>(pl: T, english: T): T => (en ? english : pl);
  const [featuredProjects, featuredBuilders] = await Promise.all([listPublicProjectsForLanding(4), listPublicBuildersForLanding(4)]);
  const labels = labelsFor(locale);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildCrew",
    url: siteUrlForLocale(locale),
    description: SEO[locale].description,
    inLanguage: localeCode(locale),
  };
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildCrew",
    url: siteUrlForLocale(locale),
    description: SEO[locale].description,
    logo: `${siteUrlForLocale(locale)}/icon.svg`,
  };

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
      <AnalyticsEvent name="landing_view" params={{ locale, market: "poland_first" }} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew</Link>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex dark:text-neutral-400">
            <a href="#people" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{c("Ludzie", "People")}</a>
            <Link href="/explore/projects" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{c("Projekty", "Projects")}</Link>
            <a href="#how-it-works" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{c("Jak to działa", "How it works")}</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <Button asChild variant="ghost" size="sm"><Link href="/login">{c("Zaloguj się", "Log in")}</Link></Button>
            <Button asChild size="sm"><Link href="/signup">{c("Dołącz do BuildCrew", "Join BuildCrew")}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end lg:px-10 lg:py-24">
          <div>
            <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{c("Ludzie · projekty · wiedza · współpraca", "People · projects · knowledge · collaboration")}</p>
            <h1 className="mt-5 max-w-[820px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">{c("Znajdź ludzi, z którymi możesz coś zbudować.", "Build your network by building real things.")}</h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">{c("BuildCrew łączy osoby tworzące własne projekty z programistami, designerami, marketerami, founderami i innymi ludźmi, którzy chcą do nich dołączyć. Znajdź ludzi do projektu, dołącz do zespołu albo pokaż to, co już budujesz.", "Meet people worth building with. Share knowledge, experience and ideas, work on projects together and turn real work into a portfolio people can trust.")}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild size="lg"><Link href="/signup">{c("Dołącz do BuildCrew", "Join BuildCrew")} <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/explore/projects">{c("Zobacz projekty", "Explore projects")}</Link></Button>
            </div>
          </div>

          <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
            <div className="flex items-center justify-between border-b border-[#d8d8d0] py-3 text-[12px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"><span>{c("Projekty szukające ludzi", "Projects looking for people")}</span><Link href="/explore/projects" className="hover:text-neutral-950 hover:underline dark:hover:text-white">{c("Zobacz wszystkie", "See all")}</Link></div>
            {featuredProjects.length ? featuredProjects.map((project) => {
              const roles = project.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType]).join(" + ");
              const stack = project.technologies.slice(0, 3).join(" · ") || c("Projekt cyfrowy", "Digital project");
              return <PreviewRow key={project.id} href={`/p/${project.id}`} name={project.name} meta={`${labels.stages[project.stage]} · ${roles || c("zespół kompletny", "team complete")}`} stack={stack} />;
            }) : <div className="border-b border-[#d8d8d0] py-5 text-[13px] leading-5 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{c("Publiczne projekty pojawią się tutaj, gdy tylko ktoś je opublikuje.", "Public projects will appear here as soon as builders publish them.")}</div>}
          </div>
        </section>

        <section className="border-y border-[#d8d8d0] bg-[#eef7d7] text-neutral-950 dark:border-[#34342f] dark:bg-[#1b2111] dark:text-neutral-100">
          <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-400">BuildCrew Sprint</p>
              <h2 className="mt-1 text-[25px] font-semibold tracking-[-0.025em]">{c("30 dni. Jedna ekipa. Jeden działający projekt.", "30 days. One crew. One shipped project.")}</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{c("Aktualny program społeczności dla osób, które chcą w krótkim czasie zebrać ekipę i dowieźć działający projekt.", "A current community program for people who want to form a crew and ship a working project in a focused timebox.")}</p>
            </div>
            <Button asChild size="lg" className="shrink-0 border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800"><Link href="/sprint">{c("Zobacz Sprint", "See the Sprint")} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </section>

        <section id="people" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10">
            <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div><p className="text-[13px] font-medium text-neutral-500">{c("Społeczność BuildCrew", "BuildCrew community")}</p><h2 className="mt-1 text-[28px] font-semibold tracking-[-0.025em]">{c("Ludzie otwarci na współpracę", "People open to opportunities")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{c("Poznawaj osoby po umiejętnościach, projektach, dostępności i tym, czego aktualnie szukają - do współpracy, rozmowy albo wymiany doświadczeń.", "Discover people by skills, projects, availability and what they are open to - collaboration, conversation or sharing experience.")}</p></div>
              <Link href="/signup" className="text-sm font-medium hover:underline">{c("Dołącz do społeczności", "Join the community")} <ArrowRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            {featuredBuilders.length ? <div className="grid gap-px overflow-hidden border border-[#d8d8d0] bg-[#d8d8d0] sm:grid-cols-2 lg:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-700">
              {featuredBuilders.map((builder) => <Link key={builder.userId} href={`/u/${builder.username}`} className="bg-white p-5 transition-colors hover:bg-[#f7f7f3] dark:bg-[#171715] dark:hover:bg-[#1d1d1a]">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{builder.username}</h3><p className="mt-0.5 text-[12px] text-neutral-500">{builder.headline || (builder.role ? labels.roles[builder.role] : "Builder")}</p></div><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#a8d62f]" /></div>
                <p className="mt-4 min-h-10 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">{builder.skills.slice(0, 4).join(" · ") || c("Buduje swój profil zawodowy", "Building a professional profile")}</p>
                <p className="mt-4 text-[12px] font-medium text-neutral-700 dark:text-neutral-200">{opportunityStatusLabel(builder.lookingFor, locale) || c("Otwarty na kontakt", "Open to connecting")}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">{builder.country ? <span className="font-medium text-neutral-700 dark:text-neutral-200">{countryLabel(builder.country)}</span> : null}{builder.languages.length ? <span>{builder.languages.slice(0,2).join(", ")}</span> : null}</div>
                <p className="mt-5 text-[12px] font-medium">{c("Zobacz profil", "View profile")} →</p>
              </Link>)}
            </div> : <div className="border-y border-[#d8d8d0] py-6 text-sm text-neutral-500 dark:border-neutral-700">{c("Załóż publiczny profil i pojaw się wśród pierwszych osób widocznych tutaj.", "Create a public profile and be among the first people visible here.")}</div>}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div><p className="text-[13px] font-medium text-neutral-500">{c("Jeden profil", "One profile")}</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">{c("Więcej niż CV.", "More than a CV.")}</h2><p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{c("Profil BuildCrew rośnie razem z Tobą: pokazuje projekty, współprace i wiedzę, którą realnie wnosisz do społeczności.", "Your BuildCrew profile grows with you: it connects projects, collaborations and the knowledge you actually contribute to the community.")}</p></div>
            <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
              <ValueRow number="01" title={c("Znajdź ludzi", "Find people")} text={c("Poznawaj współtwórców, co-founderów i specjalistów na podstawie umiejętności, zainteresowań, dostępności i kontekstu projektu.", "Meet teammates, co-founders and specialists based on skills, interests, availability and real project context.")} />
              <ValueRow number="02" title={c("Dziel się wiedzą i pomysłami", "Share knowledge and ideas")} text={c("Pytaj, pokazuj wnioski z budowania, zbieraj feedback i pomagaj innym na podstawie własnego doświadczenia.", "Ask questions, share lessons from building, collect feedback and help others with what you have learned.")} />
              <ValueRow number="03" title={c("Buduj i pokazuj projekty", "Build and showcase projects")} text={c("Projekt staje się dowodem tego, co potrafisz stworzyć, a nie tylko kolejnym punktem w profilu.", "Projects become proof of what you can create, not just another line in a profile.")} />
              <ValueRow number="04" title={c("Buduj wiarygodny profil", "Build a credible profile")} text={c("Z czasem profil pokazuje nie tylko deklarowane umiejętności, lecz także projekty, współprace i rzeczy, którymi podzieliłeś się ze społecznością.", "Over time your profile shows not just claimed skills, but projects, collaborations and useful things you shared with the community.")} />
              <ValueRow number="05" title={c("Daj się znaleźć przez dorobek", "Get discovered through your work")} text={c("Founder, startup albo przyszły współpracownik może zobaczyć, co naprawdę robiłeś, przy czym pracujesz teraz i jak wyglądała Twoja współpraca z innymi.", "A founder, startup or future collaborator can see what you actually built, what you are working on now and how you have worked with others.")} />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
            <div><p className="text-[13px] font-medium text-neutral-500">{c("Jak to działa", "How it works")}</p><h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">{c("Ludzie → wiedza → projekty → dorobek.", "People → knowledge → projects → proof of work.")}</h2></div>
            <ol className="border-t border-[#b9b9b1] dark:border-neutral-600">
              <ValueRow number="1" title={c("Uzupełnij profil", "Create your builder profile")} text={c("Dodaj umiejętności, zainteresowania i dostępność - tylko tyle, ile potrzeba, żeby zacząć poznawać właściwych ludzi.", "Add skills, interests and availability - just enough to start meeting the right people.")} />
              <ValueRow number="2" title={c("Poznaj właściwych ludzi", "Meet the right people")} text={c("Przeglądaj sieć albo korzystaj z rekomendacji, żeby znaleźć osoby warte rozmowy.", "Search the network or use recommendations to find people worth talking to.")} />
              <ValueRow number="3" title={c("Wymieniajcie się wiedzą", "Share knowledge")} text={c("Pytaj, dawaj feedback i dziel się doświadczeniem. Dobra rozmowa może być początkiem wspólnego projektu.", "Ask questions, give feedback and share experience. A useful conversation can become the start of a shared project.")} />
              <ValueRow number="4" title={c("Zbudujcie coś razem", "Build something together")} text={c("Dołącz do projektu albo zaproś kogoś do swojego zespołu i zachowaj historię wspólnej pracy.", "Join a project, invite someone to yours and keep your project history connected to the people behind it.")} />
              <ValueRow number="5" title={c("Zamień pracę w wiarygodny dorobek", "Turn work into credible proof")} text={c("Ukończone projekty i historia współpracy wzmacniają Twój profil przed kolejnym projektem, rozmową z co-founderem albo ofertą pracy.", "Completed projects and collaboration history make your profile stronger for the next project, co-founder conversation or job opportunity.")} />
            </ol>
          </div>
        </section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100"><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10"><div><p className="text-[13px] text-neutral-400">BuildCrew</p><h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">{c("Poznawaj ludzi. Dziel się wiedzą i pomysłami. Budujcie razem. Pokazuj, co naprawdę zrobiłeś.", "Meet people. Share knowledge and ideas. Build together. Show what you actually made.")}</h2></div><Button asChild variant="secondary" size="lg"><Link href="/signup">{c("Dołącz do BuildCrew", "Join BuildCrew")}</Link></Button></div></section>
      </main>

      <footer className="border-t border-[#d8d8d0] dark:border-[#34342f]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-[12px] text-neutral-500 sm:flex-row sm:items-center sm:px-8 lg:px-10"><p>© {new Date().getFullYear()} BuildCrew</p><div className="flex flex-wrap items-center gap-5"><LanguageSwitcher compact /><Link href="/explore/projects" className="hover:underline">{c("Projekty", "Projects")}</Link><Link href="/znajdz-zespol" className="hover:underline">{c("Znajdź ludzi do projektu", "Find people for a project")}</Link><Link href="/znajdz-programiste" className="hover:underline">{c("Znajdź programistę", "Find a developer")}</Link><Link href="/o-nas" className="hover:underline">{c("O BuildCrew", "About")}</Link><Link href="/terms" className="hover:underline">{c("Regulamin", "Terms")}</Link><Link href="/privacy" className="hover:underline">{c("Prywatność", "Privacy")}</Link><Link href="/login" className="hover:underline">{c("Zaloguj się", "Log in")}</Link></div></div></footer>
    </div>
  );
}

function PreviewRow({ href, name, meta, stack }: { href: string; name: string; meta: string; stack: string }) { return <Link href={href} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d8d8d0] py-4 transition-colors hover:bg-black/[0.025] dark:border-neutral-700 dark:hover:bg-white/[0.03]"><div><p className="text-[14px] font-semibold tracking-[-0.01em]">{name}</p><p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{meta}</p></div><p className="max-w-[190px] self-end text-right text-[12px] text-neutral-500 dark:text-neutral-400">{stack}</p></Link>; }
function ValueRow({ number, title, text }: { number: string; title: string; text: string }) { return <div className="grid gap-2 border-b border-[#d8d8d0] py-5 sm:grid-cols-[42px_210px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700"><span className="text-[12px] tabular-nums text-neutral-400">{number}</span><h3 className="text-[14px] font-semibold">{title}</h3><p className="max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></div>; }
