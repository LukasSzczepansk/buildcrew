import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { labelsFor } from "@/lib/constants-i18n";
import { launchNeedLabel } from "@/lib/launches";
import { SITE_URL } from "@/lib/site-config";
import type { LaunchNeed, RoleType, Stage } from "@/db/schema";

type BuilderPreview = {
  userId: string;
  username: string;
  headline?: string | null;
  avatarEmoji: string;
  role: RoleType | null;
  skills: string[];
};

type ProjectPreview = {
  id: string;
  name: string;
  tagline: string;
  stage: Stage;
  technologies: string[];
  openRoles: { id: string; roleType: RoleType; open?: number }[];
};

type LaunchPreview = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  technologies: string[];
  needs: LaunchNeed[];
  username: string;
  voteCount: number;
  commentCount: number;
  coverImage: { id: string; width: number; height: number } | null;
};

export type GeoLiveLandingConfig = {
  slug: string;
  eyebrow: string;
  heading: string;
  intro: string;
  answerLabel?: string;
  answer: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  liveHeading: string;
  liveDescription: string;
  emptyLive: string;
  explanationHeading: string;
  explanation: string[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  related: { label: string; href: string }[];
};

export function GeoLiveLanding({
  config,
  builders = [],
  projects = [],
  launches = [],
}: {
  config: GeoLiveLandingConfig;
  builders?: BuilderPreview[];
  projects?: ProjectPreview[];
  launches?: LaunchPreview[];
}) {
  const labels = labelsFor("pl");
  const url = `${SITE_URL}/${config.slug}`;
  const hasLiveData = builders.length > 0 || projects.length > 0 || launches.length > 0;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.heading,
      description: config.answer,
      url,
      inLanguage: "pl-PL",
      isPartOf: { "@type": "WebSite", name: "BuildCrew", url: SITE_URL },
      about: { "@type": "Thing", name: "Wspólne tworzenie projektów" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BuildCrew", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: config.heading, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={jsonLd} />
      <header className="border-b border-[var(--bc-line)] bg-[var(--bc-surface)]">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]">
            <span className="h-4 w-[5px] bg-[var(--bc-accent)]" aria-hidden="true" />
            BuildCrew
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/projekty" className="hidden text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline">Projekty</Link>
            <Link href="/launches" className="hidden text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline">Premiery</Link>
            <LanguageSwitcher compact />
            <Button asChild size="sm"><Link href="/signup">Dołącz</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <section className="grid gap-10 border-b border-[var(--bc-line)] pb-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-muted)]">{config.eyebrow}</p>
            <h1 className="mt-4 max-w-[820px] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[54px]">{config.heading}</h1>
            <p className="mt-5 max-w-[760px] text-[16px] leading-7 text-[var(--bc-muted)]">{config.intro}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild><Link href={config.primary.href}>{config.primary.label} <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              <Button asChild variant="outline"><Link href={config.secondary.href}>{config.secondary.label}</Link></Button>
            </div>
          </div>
          <aside className="border-l-2 border-[var(--bc-accent)] pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-faint)]">{config.answerLabel ?? "Krótka odpowiedź"}</p>
            <p className="mt-2 text-[15px] leading-6 text-[var(--bc-ink)]">{config.answer}</p>
          </aside>
        </section>

        <section className="border-b border-[var(--bc-line)] py-12">
          <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">Na żywo z BuildCrew</p>
              <h2 className="mt-2 text-[27px] font-semibold tracking-[-0.03em]">{config.liveHeading}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--bc-muted)]">{config.liveDescription}</p>
            </div>
            <div className="min-w-0">
              {hasLiveData ? (
                <div className="space-y-8">
                  {builders.length ? <BuilderPreviewList builders={builders} /> : null}
                  {projects.length ? <ProjectPreviewList projects={projects} /> : null}
                  {launches.length ? <LaunchPreviewList launches={launches} /> : null}
                </div>
              ) : (
                <div className="border-y border-[var(--bc-line)] py-6 text-sm leading-6 text-[var(--bc-muted)]">{config.emptyLive}</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-10 border-b border-[var(--bc-line)] py-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div><h2 className="text-[27px] font-semibold tracking-[-0.03em]">{config.explanationHeading}</h2></div>
          <div className="max-w-[760px] space-y-4 text-[14px] leading-7 text-[var(--bc-muted)]">
            {config.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="grid gap-10 border-b border-[var(--bc-line)] py-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div><h2 className="text-[27px] font-semibold tracking-[-0.03em]">Jak zacząć</h2></div>
          <ol className="border-t border-[var(--bc-line-strong)]">
            {config.steps.map((step, index) => (
              <li key={step.title} className="grid gap-2 border-b border-[var(--bc-line)] py-5 sm:grid-cols-[42px_210px_minmax(0,1fr)]">
                <span className="text-[11px] tabular-nums text-[var(--bc-faint)]">0{index + 1}</span>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-sm leading-6 text-[var(--bc-muted)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-b border-[var(--bc-line)] py-12">
          <h2 className="text-[27px] font-semibold tracking-[-0.03em]">Najczęstsze pytania</h2>
          <div className="mt-5 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {config.faq.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none text-[15px] font-semibold">{item.q}</summary>
                <p className="mt-2 max-w-[820px] text-sm leading-6 text-[var(--bc-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="py-10">
          <p className="text-sm font-semibold">Powiązane strony</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--bc-muted)]">
            {config.related.map((item) => <Link key={item.href} className="hover:text-[var(--bc-ink)] hover:underline" href={item.href}>{item.label}</Link>)}
          </div>
        </section>
      </main>
    </div>
  );
}

function BuilderPreviewList({ builders }: { builders: BuilderPreview[] }) {
  const labels = labelsFor("pl");
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-[13px] font-semibold">Osoby otwarte na projekty</h3>
        <Link href="/signup" className="text-[11px] text-[var(--bc-muted)] hover:underline">Zobacz więcej po dołączeniu</Link>
      </div>
      <div className="border-t border-[var(--bc-line-strong)]">
        {builders.map((builder) => (
          <article key={builder.userId} className="grid gap-3 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar username={builder.username} seed={builder.avatarEmoji || builder.userId} className="h-10 w-10 text-[13px]" />
              <div className="min-w-0">
                <Link href={`/u/${encodeURIComponent(builder.username)}`} className="truncate text-[14px] font-semibold hover:underline">{builder.username}</Link>
                <p className="truncate text-[12px] text-[var(--bc-muted)]">{builder.headline || (builder.role ? labels.roles[builder.role] : "Builder")}</p>
              </div>
            </div>
            <p className="truncate text-[12px] text-[var(--bc-muted)]">{builder.skills.slice(0, 4).join(" · ") || "Profil i projekty na BuildCrew"}</p>
            <Link href={`/u/${encodeURIComponent(builder.username)}`} className="text-[12px] font-medium hover:underline">Zobacz profil</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProjectPreviewList({ projects }: { projects: ProjectPreview[] }) {
  const labels = labelsFor("pl");
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-[13px] font-semibold">Projekty szukające ludzi</h3>
        <Link href="/projekty" className="text-[11px] text-[var(--bc-muted)] hover:underline">Wszystkie projekty</Link>
      </div>
      <div className="border-t border-[var(--bc-line-strong)]">
        {projects.map((project) => {
          const roles = project.openRoles.slice(0, 3).map((role) => labels.roles[role.roleType]);
          return (
            <article key={project.id} className="grid gap-3 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_auto] sm:items-center">
              <div className="min-w-0">
                <Link href={`/p/${project.id}`} className="text-[14px] font-semibold hover:underline">{project.name}</Link>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--bc-muted)]">{project.tagline}</p>
              </div>
              <div className="min-w-0 text-[11px] text-[var(--bc-muted)]">
                <p className="truncate">{roles.length ? `Szukają: ${roles.join(" · ")}` : labels.stages[project.stage]}</p>
                {project.technologies.length ? <p className="mt-1 truncate text-[var(--bc-faint)]">{project.technologies.slice(0, 4).join(" · ")}</p> : null}
              </div>
              <Link href={`/p/${project.id}`} className="text-[12px] font-medium hover:underline">Zobacz projekt</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LaunchPreviewList({ launches }: { launches: LaunchPreview[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-[13px] font-semibold">Ostatnie Premiery</h3>
        <Link href="/launches" className="text-[11px] text-[var(--bc-muted)] hover:underline">Wszystkie Premiery</Link>
      </div>
      <div className="border-t border-[var(--bc-line-strong)]">
        {launches.map((launch) => (
          <article key={launch.id} className="grid gap-3 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[64px_minmax(0,1fr)_minmax(170px,0.55fr)_auto] sm:items-center">
            <Link href={`/launches/${encodeURIComponent(launch.slug)}`} className="hidden overflow-hidden rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] sm:block">
              {launch.coverImage ? <img src={`/api/launches/images/${launch.coverImage.id}`} alt="" loading="lazy" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center text-[13px] font-semibold text-[var(--bc-faint)]">{launch.title.slice(0, 2).toUpperCase()}</div>}
            </Link>
            <div className="min-w-0">
              <Link href={`/launches/${encodeURIComponent(launch.slug)}`} className="text-[14px] font-semibold hover:underline">{launch.title}</Link>
              <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--bc-muted)]">{launch.tagline}</p>
              <p className="mt-1 text-[10px] text-[var(--bc-faint)]">przez {launch.username}</p>
            </div>
            <div className="min-w-0 text-[11px] text-[var(--bc-muted)]">
              {launch.needs.length ? <p className="truncate">{launch.needs.slice(0, 2).map((need) => launchNeedLabel(need, "pl")).join(" · ")}</p> : <p className="truncate">{launch.technologies.slice(0, 3).join(" · ") || "Projekt społeczności"}</p>}
              <p className="mt-1 text-[var(--bc-faint)]">↑ {launch.voteCount} · {launch.commentCount} komentarzy</p>
            </div>
            <Link href={`/launches/${encodeURIComponent(launch.slug)}`} className="text-[12px] font-medium hover:underline">Zobacz</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
