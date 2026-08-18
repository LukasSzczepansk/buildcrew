import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, ShieldCheck, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { ShareProjectButton } from "@/components/projects/share-project-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth";
import { activityLabel, getActivityState } from "@/lib/activity";
import { getProjectFreshness } from "@/lib/project-freshness";
import { ROLE_LABELS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { internationalLabels } from "@/lib/international";
import { countryLabel } from "@/lib/countries";
import { truncateMeta } from "@/lib/seo";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { getProjectById } from "@/server/data/projects";
import { listProjectCredits, listProjectUpdates, PROJECT_UPDATE_KIND_LABELS } from "@/server/data/social-projects";


function projectMetaDescription(project: {
  tagline: string;
  technologies: string[];
  openRoles: Array<{ roleType: keyof typeof ROLE_LABELS }>;
}, locale: "pl" | "en") {
  const labels = labelsFor(locale);
  const roles = project.openRoles.slice(0, 3).map((role) => labels.roles[role.roleType]);
  const stack = project.technologies.slice(0, 4);
  return truncateMeta([
    project.tagline,
    roles.length ? `${locale === "en" ? "Open roles" : "Otwarte role"}: ${roles.join(", ")}.` : "",
    stack.length ? `Stack: ${stack.join(", ")}.` : "",
    locale === "en" ? "See the project and team on BuildCrew." : "Zobacz projekt i zespół na BuildCrew.",
  ].filter(Boolean).join(" "));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string; role?: string }>;
}): Promise<Metadata> {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getRequestLocale()]);
  const project = await getProjectById(id);
  const labels = labelsFor(locale);
  if (!project) return { title: `${locale === "en" ? "Project" : "Projekt"} - BuildCrew`, robots: { index: false, follow: false } };

  const requestedRole = project.lifecycleStatus === "ACTIVE" && query.share === "role"
    ? project.openRoles.find((role) => role.id === query.role)
    : undefined;
  const roleLabel = requestedRole ? labels.roles[requestedRole.roleType] : null;
  const openRoleLabels = project.lifecycleStatus === "ACTIVE" ? project.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType]) : [];
  const baseUrl = siteUrlForLocale(locale);
  const publicUrl = `${baseUrl}/p/${project.id}`;
  const shareUrl = roleLabel
    ? `${baseUrl}/p/${project.id}?share=role&role=${encodeURIComponent(requestedRole!.id)}`
    : publicUrl;
  const imageUrl = roleLabel
    ? `${baseUrl}/api/projects/${project.id}/share-card?variant=recruitment&role=${encodeURIComponent(requestedRole!.id)}&v=${project.updatedAt.getTime()}`
    : `${baseUrl}/api/projects/${project.id}/share-card?v=${project.updatedAt.getTime()}`;
  const title = locale === "en"
    ? project.lifecycleStatus === "COMPLETED"
      ? `${project.name} - completed project | BuildCrew`
      : roleLabel
        ? `Looking for ${roleLabel} for ${project.name} | BuildCrew`
        : openRoleLabels.length
          ? `${project.name} - looking for ${openRoleLabels.join(" / ")} | BuildCrew`
          : `${project.name} - project on BuildCrew`
    : project.lifecycleStatus === "COMPLETED"
      ? `${project.name} - ukończony projekt | BuildCrew`
      : roleLabel
        ? `Szukamy ${roleLabel} do ${project.name} | BuildCrew`
        : openRoleLabels.length
          ? `${project.name} - szukamy ${openRoleLabels.join(" / ")} | BuildCrew`
          : `${project.name} - projekt na BuildCrew`;
  const description = project.lifecycleStatus === "COMPLETED" && project.outcome
    ? truncateMeta(`${project.outcome} ${locale === "en" ? "See the team and collaboration history on BuildCrew." : "Zobacz zespół i historię współpracy na BuildCrew."}`)
    : projectMetaDescription(project, locale);

  return {
    title,
    description,
    alternates: { canonical: publicUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: "website",
      locale: openGraphLocale(locale),
      siteName: "BuildCrew",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${project.name} - ${locale === "en" ? "BuildCrew project card" : "karta projektu BuildCrew"}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string; role?: string }>;
}) {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getRequestLocale()]);
  const [project, user] = await Promise.all([getProjectById(id), getCurrentUser()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  if (!project) notFound();
  const [updates, credits] = await Promise.all([
    listProjectUpdates(project.id, 6),
    project.lifecycleStatus === "COMPLETED" ? listProjectCredits(project.id) : Promise.resolve([]),
  ]);

  const requestedRole = project.lifecycleStatus === "ACTIVE" && query.share === "role"
    ? project.openRoles.find((role) => role.id === query.role)
    : undefined;
  const requestedRoleLabel = requestedRole ? labels.roles[requestedRole.roleType] : null;
  const appPath = `/projects/${project.id}`;
  const signupHref = `/signup?next=${encodeURIComponent(appPath)}`;
  const loginHref = `/login?next=${encodeURIComponent(appPath)}`;
  const crewSize = Math.max(project.members.length, project.owner ? 1 : 0);
  const totalSlots = project.roles.reduce((sum, role) => sum + role.slots, 0) + 1;
  const ownerActivity = getActivityState(project.owner?.lastActiveAt);
  const projectFreshness = getProjectFreshness(project.updatedAt, new Date(), locale);
  const baseUrl = siteUrlForLocale(locale);
  const publicUrl = `${baseUrl}/p/${project.id}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${project.name} - ${en ? "project on BuildCrew" : "projekt na BuildCrew"}`,
    description: project.lifecycleStatus === "COMPLETED" && project.outcome ? project.outcome : projectMetaDescription(project, locale),
    url: publicUrl,
    inLanguage: localeCode(locale),
    dateCreated: project.createdAt.toISOString(),
    dateModified: project.updatedAt.toISOString(),
    isPartOf: { "@type": "WebSite", name: "BuildCrew", url: siteUrlForLocale(locale) },
    mainEntity: {
      "@type": "CreativeWork",
      name: project.name,
      description: project.tagline,
      ...(project.owner?.username ? { creator: { "@type": "Person", name: project.owner.username } } : {}),
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <JsonLd data={structuredData} />
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="h-5 w-1 bg-[#C8F169]" aria-hidden="true" />
            BuildCrew
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            {user ? (
              <Button asChild size="sm"><Link href={appPath}>{en ? "Open in BuildCrew" : "Otwórz w BuildCrew"}</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href={loginHref}>{en ? "Log in" : "Zaloguj się"}</Link></Button>
                <Button asChild size="sm"><Link href={signupHref}>{en ? "Join the team" : "Dołącz do ekipy"}</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-neutral-100 bg-[#f7f7f3] p-7 dark:border-neutral-800 dark:bg-neutral-950 sm:p-9">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{labels.stages[project.stage]}</Badge>
                  {project.lifecycleStatus === "COMPLETED" ? <Badge variant="success">{en ? "Completed" : "Ukończony"}</Badge> : project.lifecycleStatus === "PAUSED" ? <Badge variant="outline">{en ? "Paused" : "Wstrzymany"}</Badge> : null}
                  <Badge variant="outline"><Users className="mr-1 h-3 w-3" /> {en ? "Team" : "Zespół"} {crewSize}/{Math.max(totalSlots, crewSize)}</Badge>
                  {project.commitment ? <Badge variant="outline">{labels.commitments[project.commitment]}</Badge> : null}
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
                <p className="mt-3 max-w-3xl text-lg text-neutral-600 dark:text-neutral-300">{project.tagline}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => <Badge key={technology} variant="outline">{technology}</Badge>)}
                </div>
                {requestedRole ? (
                  <div className="mt-6 border-l-[3px] border-[#C8F169] bg-white/70 px-4 py-3 dark:bg-neutral-900/60">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500">{en ? "Role invitation" : "Zaproszenie do roli"}</p>
                    <p className="mt-1 text-[16px] font-semibold">{en ? "Looking for" : "Szukamy"}: {requestedRoleLabel}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {requestedRole.description || (en ? "This role is still open. See the project, meet the team and message the owner on BuildCrew." : "Ta rola jest nadal otwarta. Zobacz projekt i zespół, a potem skontaktuj się z właścicielem na BuildCrew.")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap gap-2">
                  {user ? (
                    <Button asChild><Link href={appPath}>{project.lifecycleStatus === "COMPLETED" ? (en ? "See the result and team" : "Zobacz rezultat i zespół") : (en ? "See project and team" : "Zobacz projekt i zespół")} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  ) : (
                    <Button asChild><Link href={signupHref}>{project.lifecycleStatus === "COMPLETED" ? (en ? "Meet the people who built it" : "Poznaj ludzi, którzy to zbudowali") : requestedRoleLabel ? `${en ? "Join as" : "Dołącz jako"} ${requestedRoleLabel}` : (en ? "I want to join this team" : "Chcę dołączyć do tej ekipy")} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  )}
                  <ShareProjectButton projectId={project.id} projectName={project.name} projectTagline={project.tagline} openRoles={project.openRoles.map((role) => ({ id: role.id, roleType: role.roleType }))} />
                </div>
              </div>
              <div className="p-7 sm:p-9">
                <h2 className="text-lg font-semibold">{en ? "About the project" : "O projekcie"}</h2>
                {project.lifecycleStatus === "COMPLETED" && project.outcome ? <div className="mt-3 border-l-[3px] border-[#C8F169] pl-4"><p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Result" : "Rezultat"}</p><p className="mt-1 text-sm leading-6 text-neutral-800 dark:text-neutral-200">{project.outcome}</p></div> : null}
                <p className="mt-4 whitespace-pre-line leading-7 text-neutral-600 dark:text-neutral-300">{project.description}</p>
                {project.goal ? (
                  <div className="mt-6 border-l-2 border-[#C8F169] pl-4">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Next goal" : "Najbliższy cel"}</p>
                    <p className="mt-1 text-sm leading-6">{project.goal}</p>
                  </div>
                ) : null}
                {project.existingAssets.length ? (
                  <div className="mt-6">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "What already exists" : "Co już istnieje"}</p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{project.existingAssets.map((item) => labels.projectAssets[item]).join(" · ")}</p>
                  </div>
                ) : null}
                {project.ownerContribution ? (
                  <div className="mt-6 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "What the project owner brings" : "Co wnosi autor pomysłu"}</p>
                    <p className="mt-1 text-sm">{project.ownerContribution}</p>
                  </div>
                ) : null}
              </div>
            </Card>

            {updates.length ? (
              <Card className="p-7 sm:p-8">
                <div className="mb-4"><h2 className="text-lg font-semibold">{en ? "Project updates" : "Aktualizacje projektu"}</h2><p className="mt-1 text-sm text-neutral-500">{en ? "A short record of real progress, not a marketing feed." : "Krótka historia realnego postępu, a nie marketingowy feed."}</p></div>
                <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                  {updates.map((update) => <div key={update.id} className="grid gap-2 py-4 sm:grid-cols-[110px_minmax(0,1fr)]"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{en ? ({ PROGRESS: "Progress", ROLE: "Team", MILESTONE: "Milestone", LAUNCH: "Launch" } as const)[update.kind] : PROJECT_UPDATE_KIND_LABELS[update.kind]}</p><p className="mt-1 text-[11px] text-neutral-400">{update.createdAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}</p></div><div><p className="text-sm leading-6 text-neutral-700 dark:text-neutral-300">{update.body}</p><p className="mt-1 text-[13px] text-neutral-400">{update.username}</p></div></div>)}
                </div>
              </Card>
            ) : null}

            <Card className="p-7 sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">{project.lifecycleStatus === "COMPLETED" ? (en ? "Project team" : "Zespół projektu") : (en ? "Who are we looking for?" : "Kogo szukamy do ekipy?")}</h2>
                <p className="mt-1 text-sm text-neutral-500">{en ? "This is not a job listing - it is for people who want to co-build the project." : "To nie jest oferta pracy - szukamy osób, które chcą współtworzyć projekt."}</p>
              </div>
              {project.lifecycleStatus !== "COMPLETED" && project.roles.length ? (
                <div className="space-y-3">
                  {project.roles.map((role) => (
                    <div key={role.id} className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${requestedRole?.id === role.id ? "border-[#b6dc55] bg-[#C8F169]/10" : "border-neutral-200 dark:border-neutral-800"}`}>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{labels.roles[role.roleType]}</p>
                          <Badge variant={role.open > 0 ? "success" : "secondary"}>{role.open > 0 ? `${role.open} ${en ? "open" : "wolne"}` : (en ? "Filled" : "Obsadzone")}</Badge>
                        </div>
                        {role.description ? <p className="mt-1 text-sm text-neutral-500">{role.description}</p> : null}
                        {role.skills.length ? <TechnologyStack items={role.skills} max={6} compact className="mt-2" /> : null}
                        {role.preferredLevel ? <p className="mt-1 text-[13px] text-neutral-400">{en ? "Preferred level" : "Preferowany poziom"}: {labels.levels[role.preferredLevel]}</p> : null}
                      </div>
                      {role.open > 0 && !user ? <Button asChild size="sm"><Link href={signupHref}>{en ? "I want to join" : "Chcę dołączyć"}</Link></Button> : null}
                    </div>
                  ))}
                </div>
              ) : project.lifecycleStatus === "COMPLETED" && credits.length ? <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">{credits.map((credit) => <div key={credit.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-medium">{credit.usernameSnapshot}</span><span className="text-[13px] text-neutral-400">{credit.isOwner ? (en ? "Owner" : "Autor") : credit.roleType ? labels.roles[credit.roleType] : (en ? "Contributor" : "Współtwórca")}</span></div>)}</div> : <p className="text-sm text-neutral-500">{en ? "This team currently has no open roles." : "Ta ekipa nie ma obecnie otwartych ról."}</p>}
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Details" : "Szczegóły"}</p>
              <dl className="mt-3 space-y-3 text-sm">
                <PublicDetail label={en ? "Status" : "Status"} value={project.lifecycleStatus === "COMPLETED" ? (en ? "Completed" : "Ukończony") : project.lifecycleStatus === "PAUSED" ? (en ? "Paused" : "Wstrzymany") : (en ? "Active" : "Aktywny")} />
                {project.projectType ? <PublicDetail label={en ? "Type" : "Typ"} value={labels.projectTypes[project.projectType]} /> : null}
                <PublicDetail label={en ? "Stage" : "Etap"} value={labels.stages[project.stage]} />
                {project.lifecycleStatus === "ACTIVE" ? <PublicDetail label={en ? "Freshness" : "Aktualność"} value={en ? (projectFreshness.daysAgo === 0 ? "Active today" : projectFreshness.daysAgo === 1 ? "Active yesterday" : `${projectFreshness.daysAgo} days ago`) : projectFreshness.shortLabel} /> : null}
                {project.commitment ? <PublicDetail label={en ? "Time" : "Czas"} value={labels.commitments[project.commitment]} /> : null}
                {project.collaborationMode ? <PublicDetail label={en ? "Mode" : "Tryb pracy"} value={labels.collaborationModes[project.collaborationMode]} /> : null}
                <PublicDetail label={en ? "Project language" : "Język projektu"} value={intl.projectLanguage[project.projectLanguage]} />
                <PublicDetail label={en ? "Reach" : "Zasięg"} value={intl.marketScope[project.marketScope]} />
                {project.country ? <PublicDetail label={en ? "Country" : "Kraj"} value={countryLabel(project.country)} /> : null}
                {project.collaborationPace ? <PublicDetail label={en ? "Pace" : "Tempo"} value={labels.collaborationPaces[project.collaborationPace]} /> : null}
                {project.duration ? <PublicDetail label={en ? "Horizon" : "Horyzont"} value={labels.durations[project.duration]} /> : null}
              </dl>
              {project.needs.length ? <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Looking for" : "Szukamy"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{project.needs.map((need) => <Badge key={need} variant="outline">{intl.needs[need]}</Badge>)}</div>
                {project.needs.includes("FUNDING") ? <div className="mt-3 space-y-1 text-[12px] leading-5 text-neutral-500">
                  {project.fundingStage ? <p>{intl.fundingStage[project.fundingStage]}</p> : null}
                  {project.fundingAmount ? <p>{en ? "Target" : "Cel"}: {project.fundingAmount}</p> : null}
                  {project.pitchDeckUrl ? <a href={project.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-neutral-700 hover:underline dark:text-neutral-200">Pitch deck <ExternalLink className="h-3 w-3" /></a> : null}
                </div> : null}
              </div> : null}

              {project.repositoryUrl || project.demoUrl || project.designUrl || project.docsUrl ? (
                <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Links" : "Linki"}</p>
                  <div className="mt-2 space-y-2 text-sm">
                    {project.repositoryUrl ? <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>{en ? "Repository" : "Repozytorium"}</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.demoUrl ? <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Demo / landing</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.designUrl ? <a href={project.designUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Design / Figma</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.docsUrl ? <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>{en ? "Documentation" : "Dokumentacja"}</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Project owner" : "Autor projektu"}</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar username={project.owner?.username ?? "Builder"} seed={project.owner?.userId ?? project.ownerId} />
                <div>
                  <p className="font-semibold">{project.owner?.username ?? "Builder"}</p>
                  <p className={`text-[13px] ${ownerActivity === "TODAY" ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"}`}>{en ? (ownerActivity === "TODAY" ? "Active today" : ownerActivity === "THIS_WEEK" ? "Active this week" : ownerActivity === "INACTIVE" ? "Less active recently" : "No recent activity") : activityLabel(project.owner?.lastActiveAt, locale)}</p>
                </div>
              </div>
            </Card>

            {project.members.length ? (
              <Card className="p-6">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Team" : "Zespół"}</p>
                <div className="mt-3 space-y-3">
                  {project.members.slice(0, 8).map((member) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <Avatar username={member.profile?.username ?? "Builder"} seed={member.userId} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.profile?.username ?? "Builder"}</p>
                        <p className="text-[13px] text-neutral-400">{member.roleType ? labels.roles[member.roleType] : member.profile?.role ? labels.roles[member.profile.role] : (en ? "Contributor" : "Współtwórca")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="border-lime-200 bg-lime-50/70 p-6 dark:border-lime-500/20 dark:bg-lime-500/5">
              <ShieldCheck className="h-5 w-5 text-lime-600" />
              <p className="mt-3 font-semibold">{en ? "A shared project, not a contract gig" : "Wspólny projekt, nie zlecenie"}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{en ? "BuildCrew helps you find co-builders. Collaboration terms, code ownership and any financial arrangements are agreed directly between team members." : "BuildCrew pomaga znaleźć współtwórców. Zasady współpracy, prawa do kodu i ewentualne ustalenia finansowe uzgadniacie bezpośrednio między sobą."}</p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PublicDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[13px] text-neutral-400">{label}</dt><dd className="mt-0.5 text-neutral-800 dark:text-neutral-200">{value}</dd></div>;
}
