import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { LegalFooter } from "@/components/layout/legal-footer";
import { ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";
import { listProjects } from "@/server/data/projects";

const title = "Projekty do portfolio i side-projecty | BuildCrew";
const description =
  "Przeglądaj publiczne projekty tworzone przez społeczność BuildCrew. Zobacz stack, etap i otwarte role, a potem dołącz do ekipy.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projekty" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "BuildCrew",
    title,
    description,
    url: "/projekty",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default async function PublicProjectsPage() {
  const projects = await listProjects();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${SITE_URL}/projekty`,
    inLanguage: "pl-PL",
    isPartOf: { "@type": "WebSite", name: "BuildCrew", url: SITE_URL },
  };

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={jsonLd} />
      <header className="border-b border-[var(--bc-line)]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <span className="h-4 w-[5px] bg-[var(--bc-accent)]" aria-hidden="true" />
            BuildCrew
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Zaloguj</Link></Button>
            <Button asChild size="sm"><Link href="/signup">Załóż konto</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-[13px] font-medium text-[var(--bc-muted)]">Publiczne projekty BuildCrew</p>
          <h1 className="mt-3 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[48px]">Projekty do wspólnego budowania.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--bc-muted)]">
            Zobacz, co aktualnie buduje społeczność. Każdy projekt pokazuje etap, stack i role, których zespół jeszcze potrzebuje.
          </p>
        </div>

        <div className="mt-10 border-t border-[var(--bc-line-strong)]">
          {projects.length ? projects.map((project) => {
            const roles = project.openRoles.slice(0, 3).map((role) => ROLE_LABELS[role.roleType]);
            return (
              <article key={project.id} className="grid gap-4 border-b border-[var(--bc-line)] py-6 lg:grid-cols-[minmax(0,1fr)_280px_150px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
                      <Link href={`/p/${project.id}`} className="hover:underline">{project.name}</Link>
                    </h2>
                    <span className="text-[12px] text-[var(--bc-faint)]">{STAGE_LABELS[project.stage]}</span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bc-muted)]">{project.tagline}</p>
                  {project.technologies.length ? <TechnologyStack items={project.technologies} max={5} compact className="mt-3" /> : null}
                </div>

                <div className="text-[13px] leading-5 text-[var(--bc-muted)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Otwarte role</p>
                  <p className="mt-1 text-[var(--bc-ink)]">{roles.length ? roles.join(" · ") : "Ekipa kompletna"}</p>
                </div>

                <div className="lg:text-right">
                  <Link href={`/p/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
                    Zobacz projekt <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          }) : (
            <div className="border-b border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">
              Nie ma jeszcze publicznych projektów. Po publikacji pojawią się tutaj automatycznie.
            </div>
          )}
        </div>

        <div className="mt-12 border-l-2 border-[var(--bc-accent)] pl-4">
          <p className="text-[15px] font-semibold">Nie widzisz projektu dla siebie?</p>
          <p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">Załóż profil, pokaż czego szukasz i poznaj osoby, z którymi możesz zacząć własny projekt.</p>
          <Button asChild className="mt-4" size="sm"><Link href="/signup">Załóż profil</Link></Button>
        </div>

        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
