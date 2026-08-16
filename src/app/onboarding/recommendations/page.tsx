import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { BuilderCard } from "@/components/builders/builder-card";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { computeMatch } from "@/lib/matching";
import { getRequestLocale } from "@/lib/site-server";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { listIdeas, listProjects } from "@/server/data/projects";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Your first matches - BuildCrew" : "Pierwsze dopasowania - BuildCrew",
    robots: { index: false, follow: false },
  };
}

export default async function OnboardingRecommendationsPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const [builders, projects, ideas] = await Promise.all([listBuilderProfiles(user.id), listProjects({}, user.id), listIdeas(user.id)]);

  const builderMatches = builders
    .filter((builder) => builder.onboardingCompleted)
    .map((builder) => ({
      builder,
      match: computeMatch(
        { userId: profile.userId, username: profile.username, role: profile.role as RoleType | null, level: profile.level as Level | null, weeklyHours: profile.weeklyHours as Commitment | null, interests: profile.interests, goals: profile.goals as Goal[] },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[] },
        locale,
      ),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);

  const ideaMatches = ideas
    .filter((idea) => idea.ownerId !== user.id)
    .sort((a, b) => {
      const aShared = a.interests.filter((interest) => profile.interests.includes(interest)).length;
      const bShared = b.interests.filter((interest) => profile.interests.includes(interest)).length;
      return bShared - aShared || b.interestedCount - a.interestedCount;
    })
    .slice(0, 3);

  const projectMatches = projects
    .filter((project) => project.ownerId !== user.id && project.openRoles.length > 0)
    .map((project) => ({ project, match: scoreProject(profile, project, locale) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] px-4 py-8 sm:px-6 sm:py-10">
      <AnalyticsEvent name="profile_completed" params={{ source: "onboarding" }} />
      <main className="mx-auto w-full max-w-[1120px]">
        <header className="border-b border-[var(--bc-line-strong)] pb-6">
          <p className="bc-kicker">{en ? "Profile ready" : "Profil gotowy"}</p>
          <h1 className="mt-2 max-w-[760px] text-[clamp(30px,4vw,46px)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--bc-ink)]">
            {en ? `Your first matches, ${profile.username}.` : `Pierwsze dopasowania dla ${profile.username}.`}
          </h1>
          <p className="mt-3 max-w-[700px] text-[14px] leading-6 text-[var(--bc-muted)]">
            {en ? "We start with people and projects that fit your role, availability, interests and goals. You can update these details later in your profile." : "Zaczynamy od ludzi i projektów, które pasują do Twojej roli, dostępności, zainteresowań i celu. Możesz poprawić te dane później w profilu."}
          </p>
        </header>

        <section className="mt-8">
          <SectionHeader title={en ? "People worth talking to" : "Ludzie do rozmowy"} meta={en ? `${builderMatches.length} first matches` : `${builderMatches.length} pierwsze dopasowania`} href="/builders" locale={locale} />
          {builderMatches.length ? (
            <div className="mt-3 space-y-2.5">
              {builderMatches.map(({ builder, match }) => (
                <BuilderCard
                  locale={locale}
                  key={builder.userId}
                  matchScore={match.score}
                  matchReasons={match.reasons}
                  builder={{ userId: builder.userId, username: builder.username, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, lastActiveAt: builder.lastActiveAt, createdAt: builder.createdAt }}
                />
              ))}
            </div>
          ) : <EmptyLine text={en ? "There aren’t enough active profiles yet for a meaningful match." : "Nie mamy jeszcze wystarczającej liczby aktywnych profili do sensownego dopasowania."} />}
        </section>

        <section className="mt-9">
          <SectionHeader title={en ? "Projects for you" : "Projekty dla Ciebie"} meta={en ? `${projectMatches.length} suggestions` : `${projectMatches.length} propozycje`} href="/projects" locale={locale} />
          {projectMatches.length ? (
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {projectMatches.map(({ project, match }) => (
                <article key={project.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_260px_96px_130px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link href={`/projects/${project.id}`} className="text-[17px] font-semibold tracking-[-0.018em] hover:underline">{project.name}</Link>
                      <span className="text-[12px] text-[var(--bc-faint)]">{labels.stages[project.stage]}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[var(--bc-muted)]">{project.tagline}</p>
                    {project.technologies.length ? <TechnologyStack items={project.technologies} max={5} compact className="mt-3" /> : null}
                  </div>
                  <div className="border-t border-[var(--bc-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Why it fits" : "Dlaczego pasuje"}</p>
                    <p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">{match.reasons[0] || (en ? "The project has open roles and is worth checking." : "Projekt ma otwarte role i warto go sprawdzić.")}</p>
                    {project.commitment ? <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--bc-faint)]"><Clock3 className="h-3 w-3" />{labels.commitments[project.commitment]}</p> : null}
                  </div>
                  <div className="border-t border-[var(--bc-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Match</p><p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#94bf28] dark:text-[var(--bc-accent)]">{match.score}%</p></div>
                  <div className="border-t border-[var(--bc-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><Button asChild size="sm" className="w-full"><Link href={`/projects/${project.id}`}>{en ? "View" : "Zobacz"} <ArrowRight className="h-3.5 w-3.5" /></Link></Button></div>
                </article>
              ))}
            </div>
          ) : <EmptyLine text={en ? "There are no open projects matching your profile yet." : "Nie ma jeszcze otwartych projektów dopasowanych do Twojego profilu."} />}
        </section>

        <section className="mt-9">
          <SectionHeader title={en ? "If none of the projects feels right" : "Jeśli żaden projekt Cię nie przekonuje"} meta={en ? `${ideaMatches.length} ideas to discuss` : `${ideaMatches.length} pomysły do przegadania`} href="/ideas" locale={locale} />
          {ideaMatches.length ? (
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {ideaMatches.map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`} className="grid gap-2 py-4 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div><p className="text-[14px] font-semibold">{idea.name}</p><p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--bc-muted)]">{idea.tagline}</p><p className="mt-1 text-[12px] text-[var(--bc-faint)]">{idea.interests.slice(0, 3).join(" · ")} · {idea.interestedCount} {en ? "interested" : "zainteresowanych"}</p></div>
                  <span className="text-[13px] font-medium">{en ? "Check it out" : "Sprawdź"} →</span>
                </Link>
              ))}
            </div>
          ) : <EmptyLine text={en ? "No ideas yet. You can add your own in under a minute or check the Build Pool." : "Nie ma jeszcze pomysłów. Możesz dodać własny w mniej niż minutę albo wejść do Build Pool."} />}
          <div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href="/ideas">{en ? "Add / browse ideas" : "Dodaj / zobacz pomysły"}</Link></Button><Button asChild variant="ghost" size="sm"><Link href="/build">{en ? "Find people without a project" : "Znajdź ludzi bez projektu"}</Link></Button></div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-[var(--bc-line-strong)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[560px] text-[13px] leading-5 text-[var(--bc-muted)]">{en ? "This is only the first ranking. As more real activity appears in BuildCrew, the next recommendations will get better." : "To dopiero pierwszy ranking. Im więcej realnej aktywności pojawi się w BuildCrew, tym lepsze będą kolejne rekomendacje."}</p>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/ideas">{en ? "Add an idea" : "Dodaj pomysł"}</Link></Button><Button asChild><Link href={nextPath}>{nextPath === "/dashboard" ? (en ? "Go to Home" : "Przejdź do Start") : (en ? "Continue" : "Kontynuuj")} <ArrowRight className="h-4 w-4" /></Link></Button></div>
        </footer>
      </main>
    </div>
  );
}

function scoreProject(profile: Awaited<ReturnType<typeof getProfileByUserId>>, project: Awaited<ReturnType<typeof listProjects>>[number], locale: AppLocale) {
  let score = 0;
  const reasons: string[] = [];
  if (!profile) return { score: 0, reasons };
  const en = locale === "en";
  const labels = labelsFor(locale);

  const exactRoles = project.openRoles.filter((role) => role.roleType === profile.role);
  if (exactRoles.length) { score += 45; reasons.push(en ? `The project is looking for ${profile.role ? labels.roles[profile.role as RoleType] : "a role similar to yours"}` : `Projekt szuka roli ${profile.role ? labels.roles[profile.role as RoleType] : "podobnej do Twojej"}`); }
  const roleSkills = new Set(project.openRoles.flatMap((role) => role.skills));
  const sharedSkills = profile.skills.filter((skill) => roleSkills.has(skill) || project.technologies.includes(skill));
  if (sharedSkills.length) { score += Math.min(30, sharedSkills.length * 10); reasons.push(en ? `Your stack fits: ${sharedSkills.slice(0, 3).join(" · ")}` : `Pasuje Twój stack: ${sharedSkills.slice(0, 3).join(" · ")}`); }
  const sharedInterests = profile.interests.filter((interest) => project.interests.includes(interest));
  if (sharedInterests.length) { score += Math.min(15, sharedInterests.length * 8); reasons.push(en ? `Shared area: ${sharedInterests.slice(0, 2).join(" · ")}` : `Wspólny obszar: ${sharedInterests.slice(0, 2).join(" · ")}`); }
  if (profile.weeklyHours && project.commitment && profile.weeklyHours === project.commitment) { score += 10; reasons.push(en ? "Your weekly availability matches" : "Pasuje deklarowany czas tygodniowo"); }
  if (score === 0) score = 20;
  return { score: Math.min(100, score), reasons };
}

function SectionHeader({ title, meta, href, locale }: { title: string; meta: string; href: string; locale: AppLocale }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-[20px] font-semibold tracking-[-0.018em]">{title}</h2><p className="mt-0.5 text-[12px] text-[var(--bc-faint)]">{meta}</p></div><Link href={href} className="text-[13px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{locale === "en" ? "View all" : "Zobacz wszystkie"}</Link></div>;
}

function EmptyLine({ text }: { text: string }) {
  return <div className="mt-3 border-y border-[var(--bc-line)] py-6 text-sm text-[var(--bc-muted)]">{text}</div>;
}
