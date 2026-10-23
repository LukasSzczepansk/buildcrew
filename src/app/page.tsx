import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bug, Code2, Lightbulb, Megaphone, Palette, Rocket, Trophy } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ChatMock, PersonMock, ProjectMock, RoleFormMock, TasksMock } from "@/components/landing/product-mockups";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listPublicProjectsForLanding } from "@/server/data/projects";
import { listPublicBuildersForLanding } from "@/server/data/profiles";

const SEO = {
  pl: {
    title: "BuildCrew - znajdź programistę, designera lub zespół do projektu",
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

  const audiences = [
    { icon: Code2, label: c("Programiści", "Developers") },
    { icon: Palette, label: c("Designerzy", "Designers") },
    { icon: Megaphone, label: c("Marketerzy", "Marketers") },
    { icon: Lightbulb, label: c("Founderzy", "Founders") },
    { icon: Bug, label: c("Testerzy", "Testers") },
  ];

  const steps = [
    {
      n: "01",
      title: c("Dodaj projekt", "Post a project"),
      text: c("Powiedz, kogo szukasz.", "Say who you need."),
      visual: (
        <RoleFormMock
          title={c("Moja aplikacja", "My app")}
          note={c("2 zgłoszenia", "2 applications")}
          roles={[
            { label: c("Frontend", "Frontend"), active: true },
            { label: c("Designer", "Designer"), active: true },
            { label: c("Marketing", "Marketing") },
          ]}
        />
      ),
    },
    {
      n: "02",
      title: c("Znajdź ludzi", "Find people"),
      text: c("Dopasowanie po umiejętnościach.", "Matched by skills."),
      visual: (
        <div className="space-y-2.5">
          <PersonMock name="Ola Nowak" role={c("Designer UI/UX", "UI/UX Designer")} skills={["Figma", "Design system"]} match={94} />
          <PersonMock name="Marek Lis" role="Frontend" skills={["React", "TypeScript"]} match={88} className="translate-x-3 opacity-90" />
        </div>
      ),
    },
    {
      n: "03",
      title: c("Budujcie razem", "Build together"),
      text: c("Zadania i czat w jednym miejscu.", "Tasks and chat in one place."),
      visual: (
        <div className="space-y-2.5">
          <TasksMock
            tasks={[
              { title: c("Makiety ekranu głównego", "Home screen mockups"), done: true, who: "Ola Nowak" },
              { title: c("Logowanie i profil", "Login and profile"), who: "Marek Lis" },
            ]}
          />
          <ChatMock lines={[{ text: c("Mam gotowe makiety!", "Mockups are ready!") }, { mine: true, text: c("Super, wchodzę w kod.", "Great, starting on code.") }]} />
        </div>
      ),
    },
  ];

  const sampleProject = {
    name: "FocusFlow",
    tagline: c("Aplikacja do skupienia, którą budujemy po godzinach.", "A focus app we are building after hours."),
  };

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
      <AnalyticsEvent name="landing_view" params={{ locale, market: "poland_first" }} />

      <header className="sticky top-0 z-30 border-b border-[var(--bc-line)] bg-[var(--bc-canvas)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <span className="h-4 w-[5px] rounded-full bg-[var(--bc-accent)] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />BuildCrew
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--bc-muted)] md:flex">
            <a href="#how-it-works" className="hover:text-[var(--bc-ink)]">{c("Jak to działa", "How it works")}</a>
            <a href="#live" className="hover:text-[var(--bc-ink)]">{c("Na żywo", "Live now")}</a>
            <Link href="/explore/projects" className="hover:text-[var(--bc-ink)]">{c("Projekty", "Projects")}</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/login">{c("Zaloguj się", "Log in")}</Link></Button>
            <Button asChild size="sm"><Link href="/signup">{c("Dołącz", "Join")}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24 -z-10 h-[460px] w-[460px] rounded-full bg-[var(--bc-accent)]/25 blur-[120px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-40 -z-10 h-[360px] w-[360px] rounded-full bg-[#f3c969]/20 blur-[120px]" />
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:px-10 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 py-1 text-[12px] font-medium text-[var(--bc-muted)] shadow-[var(--bc-shadow-xs)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />
                {c("Dla ludzi, którzy budują", "For people who build")}
              </span>
              <h1 className="mt-6 text-[52px] leading-[0.98] tracking-[-0.025em] sm:text-[68px] lg:text-[82px]">
                {c("Znajdź ludzi do swojego projektu.", "Find the people to build with.")}
              </h1>
              <p className="mt-6 max-w-md text-[18px] leading-7 text-[var(--bc-muted)]">
                {c("Programiści, designerzy, marketerzy. Jedno miejsce.", "Developers, designers, marketers. One place.")}
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <Button asChild size="lg"><Link href="/signup">{c("Zacznij za darmo", "Start for free")} <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/explore/projects">{c("Zobacz projekty", "Explore projects")}</Link></Button>
              </div>
            </div>

            {/* Product collage */}
            <div className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[460px]" aria-hidden="true">
              <ProjectMock
                className="absolute left-0 top-6 w-[84%] -rotate-[1.5deg] sm:w-[78%]"
                name={featuredProjects[0]?.name ?? sampleProject.name}
                tagline={featuredProjects[0]?.tagline ?? sampleProject.tagline}
                roles={(featuredProjects[0]?.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType])) ?? [c("Designer", "Designer"), "Frontend"]}
                stack={featuredProjects[0]?.technologies.slice(0, 3) ?? ["React", "Node.js", "Postgres"]}
                filled={3}
                total={5}
              />
              <PersonMock
                className="absolute bottom-6 right-0 w-[68%] rotate-[2deg]"
                name="Ola Nowak"
                role={c("Designer UI/UX", "UI/UX Designer")}
                skills={["Figma", c("Badania UX", "UX research")]}
                match={94}
              />
              <ChatMock
                className="absolute right-2 top-0 w-[58%] rotate-[1deg] sm:right-0"
                lines={[{ text: c("Cześć! Dołączę do zespołu.", "Hi! I would love to join.") }]}
              />
            </div>
          </div>
        </section>

        {/* AUDIENCE STRIP */}
        <section className="border-y border-[var(--bc-line)] bg-[var(--bc-surface)]/60">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 sm:px-8 lg:px-10">
            {audiences.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--bc-muted)]">
                <Icon className="h-4 w-4 text-[var(--bc-accent-ink)]" aria-hidden="true" />{label}
              </span>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <h2 className="bc-display max-w-xl text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-[52px]">{c("Od pomysłu do zespołu w trzech krokach.", "From idea to team in three steps.")}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="flex flex-col rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-5">
                <div className="mb-5 flex min-h-[210px] flex-1 flex-col justify-center overflow-hidden rounded-[var(--bc-radius)] bg-[var(--bc-surface-2)] p-4">{step.visual}</div>
                <p className="text-[12px] font-semibold tabular-nums tracking-[0.08em] text-[var(--bc-accent-ink)]">{step.n}</p>
                <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.015em]">{step.title}</h3>
                <p className="mt-1 text-[15px] text-[var(--bc-muted)]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE DATA */}
        {featuredProjects.length || featuredBuilders.length ? (
          <section id="live" className="scroll-mt-20 border-y border-[var(--bc-line)] bg-[var(--bc-surface)]">
            <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="bc-display text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-[48px]">{c("Dzieje się teraz.", "Happening now.")}</h2>
                <Link href="/explore/projects" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">{c("Wszystkie projekty", "All projects")} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>

              {featuredProjects.length ? (
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {featuredProjects.slice(0, 4).map((project) => {
                    const roles = project.openRoles.slice(0, 3).map((role) => labels.roles[role.roleType]);
                    return (
                      <Link key={project.id} href={`/p/${project.id}`} className="bc-lift group flex min-w-0 flex-col gap-4 rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[var(--bc-shadow-xs)]">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--bc-radius)] bg-[#1c1b17] text-[15px] font-semibold text-[#c8f169]">{project.name.slice(0, 1).toUpperCase()}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[16px] font-semibold tracking-[-0.01em]">{project.name}</p>
                            <p className="text-[12px] text-[var(--bc-faint)]">{labels.stages[project.stage]}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--bc-faint)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </div>
                        {project.technologies.length ? <TechnologyStack items={project.technologies} max={4} compact /> : null}
                        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-[var(--bc-line)] pt-3 text-[12px]">
                          <span className="text-[var(--bc-faint)]">{c("Szukają:", "Looking for:")}</span>
                          {roles.length
                            ? roles.map((role) => <span key={role} className="rounded-full border border-dashed border-[var(--bc-line-strong)] px-2.5 py-[2px] font-medium">{role}</span>)
                            : <span className="font-medium">{c("zespół kompletny", "team complete")}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {featuredBuilders.length ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredBuilders.map((builder) => (
                    <Link key={builder.userId} href={`/u/${builder.username}`} className="bc-lift flex items-center gap-3 rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4 shadow-[var(--bc-shadow-xs)]">
                      <Avatar username={builder.username} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{builder.username}</p>
                        <p className="truncate text-[12px] text-[var(--bc-muted)]">{builder.role ? labels.roles[builder.role] : "Builder"}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-[var(--bc-accent-ink)]">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bc-accent-strong)]" />
                          {opportunityStatusLabel(builder.lookingFor, locale) || c("Otwarty na kontakt", "Open to connecting")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* SHOWCASE + PROGRAMS */}
        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Link href="/launches" className="bc-lift group relative overflow-hidden rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-6 shadow-[var(--bc-shadow-xs)] sm:p-8">
              <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-accent-ink)]"><Rocket className="h-3.5 w-3.5" aria-hidden="true" />{c("Premiery", "Launches")}</p>
              <h3 className="bc-display mt-3 max-w-xs text-[34px] leading-[1.05] tracking-[-0.015em]">{c("Pokaż, co zbudowałeś.", "Show what you built.")}</h3>
              <div className="mt-6 -mb-14 flex gap-4 sm:-mb-20" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/showcase-demo/codelens.svg" alt="" loading="lazy" className="w-[70%] shrink-0 rounded-[var(--bc-radius)] border border-[var(--bc-line)] shadow-[var(--bc-shadow-md)] transition-transform duration-300 group-hover:-translate-y-1" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/showcase-demo/devshelf.svg" alt="" loading="lazy" className="mt-8 w-[60%] shrink-0 rounded-[var(--bc-radius)] border border-[var(--bc-line)] shadow-[var(--bc-shadow-md)] transition-transform duration-300 group-hover:translate-y-0" />
              </div>
            </Link>

            <div className="grid gap-5">
              <Link href="/sprint" className="bc-lift group flex flex-col justify-between rounded-[var(--bc-radius-lg)] border border-[var(--bc-accent-strong)]/40 bg-[var(--bc-accent-soft)] p-6 shadow-[var(--bc-shadow-xs)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-accent-ink)]">BuildCrew Sprint</p>
                <div className="mt-8">
                  <p className="bc-display text-[56px] leading-none tracking-[-0.02em]">30</p>
                  <p className="mt-1 text-[16px] font-medium">{c("dni. Jedna ekipa. Działający projekt.", "days. One crew. One shipped project.")}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium">{c("Zobacz Sprint", "See the Sprint")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
              <Link href="/explore/hackathons" className="bc-lift group flex items-center justify-between gap-4 rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-6 shadow-[var(--bc-shadow-xs)]">
                <div>
                  <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-accent-ink)]"><Trophy className="h-3.5 w-3.5" aria-hidden="true" />{c("Hackathony", "Hackathons")}</p>
                  <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{c("Zbierz ekipę na weekend.", "Build a team for the weekend.")}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--bc-faint)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative isolate overflow-hidden border-y border-[#2d2d26] bg-[#1c1b17] text-[#f2f0e8]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 h-[360px] w-[360px] rounded-full bg-[#c8f169]/20 blur-[110px]" />
          <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-10 lg:py-20">
            <h2 className="bc-display max-w-xl text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[56px]">{c("Zacznij budować z ludźmi.", "Start building with people.")}</h2>
            <Button asChild variant="secondary" size="lg" className="shrink-0"><Link href="/signup">{c("Dołącz do BuildCrew", "Join BuildCrew")} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--bc-line)]">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-[12px] text-[var(--bc-faint)] sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} BuildCrew</p>
          <div className="flex flex-wrap items-center gap-5">
            <LanguageSwitcher compact />
            <Link href="/explore/projects" className="hover:underline">{c("Projekty", "Projects")}</Link>
            <Link href="/znajdz-ludzi-do-projektu" className="hover:underline">{c("Znajdź ludzi do projektu", "Find people for a project")}</Link>
            <Link href="/znajdz-programiste" className="hover:underline">{c("Znajdź programistę", "Find a developer")}</Link>
            <Link href="/o-nas" className="hover:underline">{c("O BuildCrew", "About")}</Link>
            <Link href="/terms" className="hover:underline">{c("Regulamin", "Terms")}</Link>
            <Link href="/privacy" className="hover:underline">{c("Prywatność", "Privacy")}</Link>
            <Link href="/login" className="hover:underline">{c("Zaloguj się", "Log in")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
