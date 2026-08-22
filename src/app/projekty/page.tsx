import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { LegalFooter } from "@/components/layout/legal-footer";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listProjects } from "@/server/data/projects";

const COPY = {
  pl: {
    title: "Projekty do wspólnego budowania | BuildCrew",
    description: "Przeglądaj publiczne projekty społeczności BuildCrew. Zobacz technologie, etap, wolne role i znajdź ekipę do wspólnego budowania.",
    login: "Zaloguj się", signup: "Utwórz konto", eyebrow: "Publiczne projekty BuildCrew", heading: "Projekty, które możecie zbudować razem.",
    intro: "Zobacz, co społeczność buduje teraz. Każdy projekt pokazuje etap, technologie i role, których zespół nadal potrzebuje.",
    roles: "Szukamy", complete: "Ekipa kompletna", see: "Zobacz projekt", none: "Nie ma jeszcze publicznych projektów. Pojawią się tutaj automatycznie po publikacji.",
    noFit: "Nie widzisz jeszcze projektu dla siebie?", noFitBody: "Utwórz profil, pokaż czego szukasz i poznaj ludzi, z którymi możesz rozpocząć własny projekt.", profile: "Utwórz profil",
  },
  en: {
    title: "Projects to join and build together | BuildCrew",
    description: "Browse public projects built by the BuildCrew community. See the stack, stage and open roles, then join a team.",
    login: "Log in", signup: "Create account", eyebrow: "Public BuildCrew projects", heading: "Projects worth building together.",
    intro: "See what the community is building right now. Every project shows its stage, stack and the roles the team still needs.",
    roles: "Open roles", complete: "Team complete", see: "See project", none: "There are no public projects yet. Published projects will appear here automatically.",
    noFit: "Nothing fits yet?", noFitBody: "Create a profile, show what you're looking for and meet people you could start a project with.", profile: "Create profile",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  const canonicalPath = locale === "en" ? "/explore/projects" : "/projekty";
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `${siteUrlForLocale(locale)}${canonicalPath}` },
    openGraph: { type: "website", locale: openGraphLocale(locale), siteName: "BuildCrew", title: copy.title, description: copy.description, url: `${siteUrlForLocale(locale)}${canonicalPath}` },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProjectsPage() {
  const [projects, locale] = await Promise.all([listProjects(), getRequestLocale()]);
  const copy = COPY[locale];
  const labels = labelsFor(locale);
  const canonicalPath = locale === "en" ? "/explore/projects" : "/projekty";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: `${siteUrlForLocale(locale)}${canonicalPath}`,
    inLanguage: localeCode(locale),
    isPartOf: { "@type": "WebSite", name: "BuildCrew", url: siteUrlForLocale(locale) },
  };

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={jsonLd} />
      <header className="border-b border-[var(--bc-line)]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" aria-hidden="true" />BuildCrew</Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><Button asChild variant="ghost" size="sm"><Link href="/login">{copy.login}</Link></Button><Button asChild size="sm"><Link href="/signup">{copy.signup}</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="max-w-3xl"><p className="text-[13px] font-medium text-[var(--bc-muted)]">{copy.eyebrow}</p><h1 className="mt-3 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[48px]">{copy.heading}</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--bc-muted)]">{copy.intro}</p></div>

        <div className="mt-10 border-t border-[var(--bc-line-strong)]">
          {projects.length ? projects.map((project) => {
            const roles = project.openRoles.slice(0, 3).map((role) => labels.roles[role.roleType]);
            return <article key={project.id} className="grid gap-4 border-b border-[var(--bc-line)] py-6 lg:grid-cols-[minmax(0,1fr)_280px_150px] lg:items-center">
              <div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-[19px] font-semibold tracking-[-0.02em]"><Link href={`/p/${project.id}`} className="hover:underline">{project.name}</Link></h2><span className="text-[12px] text-[var(--bc-faint)]">{labels.stages[project.stage]}</span></div><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bc-muted)]">{project.tagline}</p>{project.technologies.length ? <TechnologyStack items={project.technologies} max={5} compact className="mt-3" /> : null}</div>
              <div className="text-[13px] leading-5 text-[var(--bc-muted)]"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy.roles}</p><p className="mt-1 text-[var(--bc-ink)]">{roles.length ? roles.join(" · ") : copy.complete}</p></div>
              <div className="lg:text-right"><Link href={`/p/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">{copy.see} <ArrowRight className="h-3.5 w-3.5" /></Link></div>
            </article>;
          }) : <div className="border-b border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">{copy.none}</div>}
        </div>

        <div className="mt-12 border-l-2 border-[var(--bc-accent)] pl-4"><p className="text-[15px] font-semibold">{copy.noFit}</p><p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">{copy.noFitBody}</p><Button asChild className="mt-4" size="sm"><Link href="/signup">{copy.profile}</Link></Button></div>
        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
