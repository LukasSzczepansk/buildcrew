import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { ShareProjectButton } from "@/components/projects/share-project-button";
import { getCurrentUser } from "@/lib/auth";
import { activityLabel, getActivityState } from "@/lib/activity";
import { DISCORD_INVITE_URL } from "@/lib/community";
import { absoluteUrl } from "@/lib/email";
import {
  COLLABORATION_MODE_LABELS,
  COLLABORATION_PACE_LABELS,
  COMMITMENT_LABELS,
  LEVEL_LABELS,
  PROJECT_ASSET_LABELS,
  PROJECT_DURATION_LABELS,
  PROJECT_TYPE_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import { getProjectById } from "@/server/data/projects";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string; role?: string }>;
}): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectById(id);
  if (!project) return { title: "Projekt — BuildCrew" };

  const requestedRole = query.share === "role"
    ? project.openRoles.find((role) => role.id === query.role)
    : undefined;
  const roleLabel = requestedRole ? ROLE_LABELS[requestedRole.roleType] : null;
  const publicUrl = absoluteUrl(`/p/${project.id}`);
  const shareUrl = roleLabel
    ? absoluteUrl(`/p/${project.id}?share=role&role=${encodeURIComponent(requestedRole!.id)}`)
    : publicUrl;
  const imageUrl = roleLabel
    ? absoluteUrl(`/api/projects/${project.id}/share-card?variant=recruitment&role=${encodeURIComponent(requestedRole!.id)}&v=${project.updatedAt.getTime()}`)
    : absoluteUrl(`/api/projects/${project.id}/share-card?v=${project.updatedAt.getTime()}`);
  const title = roleLabel
    ? `Szukamy ${roleLabel} do ${project.name} — BuildCrew`
    : `${project.name} — projekt na BuildCrew`;

  return {
    title,
    description: project.tagline,
    alternates: { canonical: publicUrl },
    openGraph: {
      title,
      description: project.tagline,
      url: shareUrl,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${project.name} — karta projektu BuildCrew` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.tagline,
      images: [imageUrl],
    },
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, user] = await Promise.all([getProjectById(id), getCurrentUser()]);
  if (!project) notFound();

  const appPath = `/projects/${project.id}`;
  const signupHref = `/signup?next=${encodeURIComponent(appPath)}`;
  const loginHref = `/login?next=${encodeURIComponent(appPath)}`;
  const crewSize = Math.max(project.members.length, project.owner ? 1 : 0);
  const totalSlots = project.roles.reduce((sum, role) => sum + role.slots, 0) + 1;
  const ownerActivity = getActivityState(project.owner?.lastActiveAt);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="h-5 w-1 bg-[#C8F169]" aria-hidden="true" />
            BuildCrew
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="gap-1.5"><MessageCircle className="h-4 w-4" /> Discord</a>
            </Button>
            {user ? (
              <Button asChild size="sm"><Link href={appPath}>Otwórz w BuildCrew</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href={loginHref}>Zaloguj się</Link></Button>
                <Button asChild size="sm"><Link href={signupHref}>Dołącz do ekipy</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mb-6 flex flex-col gap-2 rounded-lg border border-lime-200 bg-lime-50 p-4 transition hover:border-lime-300 dark:border-lime-500/20 dark:bg-lime-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-lime-900 dark:text-lime-200">Discord BuildCrew</p>
            <p className="mt-0.5 text-xs text-lime-800/80 dark:text-lime-200/70">Poznaj społeczność, szukaj osób do ekipy i śledź aktualne wydarzenia BuildCrew.</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-lime-900 dark:text-lime-200">Wejdź na Discord <ExternalLink className="h-3.5 w-3.5" /></span>
        </a>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-neutral-100 bg-[#f7f7f3] p-7 dark:border-neutral-800 dark:bg-neutral-950 sm:p-9">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{STAGE_LABELS[project.stage]}</Badge>
                  <Badge variant="outline"><Users className="mr-1 h-3 w-3" /> Ekipa {crewSize}/{Math.max(totalSlots, crewSize)}</Badge>
                  {project.commitment ? <Badge variant="outline">{COMMITMENT_LABELS[project.commitment]}</Badge> : null}
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
                <p className="mt-3 max-w-3xl text-lg text-neutral-600 dark:text-neutral-300">{project.tagline}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => <Badge key={technology} variant="outline">{technology}</Badge>)}
                </div>
                <div className="mt-7 flex flex-wrap gap-2">
                  {user ? (
                    <Button asChild><Link href={appPath}>Zobacz projekt i ekipę <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  ) : (
                    <Button asChild><Link href={signupHref}>Chcę dołączyć do tej ekipy <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  )}
                  <ShareProjectButton projectId={project.id} projectName={project.name} projectTagline={project.tagline} openRoles={project.openRoles.map((role) => ({ id: role.id, roleType: role.roleType }))} />
                </div>
              </div>
              <div className="p-7 sm:p-9">
                <h2 className="text-lg font-semibold">O projekcie</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-neutral-600 dark:text-neutral-300">{project.description}</p>
                {project.goal ? (
                  <div className="mt-6 border-l-2 border-[#C8F169] pl-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Najbliższy cel</p>
                    <p className="mt-1 text-sm leading-6">{project.goal}</p>
                  </div>
                ) : null}
                {project.existingAssets.length ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Co już istnieje</p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{project.existingAssets.map((item) => PROJECT_ASSET_LABELS[item]).join(" · ")}</p>
                  </div>
                ) : null}
                {project.ownerContribution ? (
                  <div className="mt-6 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Co wnosi autor pomysłu</p>
                    <p className="mt-1 text-sm">{project.ownerContribution}</p>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-7 sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Kogo szukamy do ekipy?</h2>
                <p className="mt-1 text-sm text-neutral-500">Nie jest to oferta pracy — chodzi o osoby, które chcą współtworzyć projekt.</p>
              </div>
              {project.roles.length ? (
                <div className="space-y-3">
                  {project.roles.map((role) => (
                    <div key={role.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{ROLE_LABELS[role.roleType]}</p>
                          <Badge variant={role.open > 0 ? "success" : "secondary"}>{role.open > 0 ? `${role.open} wolne` : "Obsadzone"}</Badge>
                        </div>
                        {role.description ? <p className="mt-1 text-sm text-neutral-500">{role.description}</p> : null}
                        {role.skills.length ? <TechnologyStack items={role.skills} max={6} compact className="mt-2" /> : null}
                        {role.preferredLevel ? <p className="mt-1 text-xs text-neutral-400">Preferowany poziom: {LEVEL_LABELS[role.preferredLevel]}</p> : null}
                      </div>
                      {role.open > 0 && !user ? <Button asChild size="sm"><Link href={signupHref}>Chcę dołączyć</Link></Button> : null}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-neutral-500">Ta ekipa nie ma obecnie otwartych ról.</p>}
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Szczegóły</p>
              <dl className="mt-3 space-y-3 text-sm">
                {project.projectType ? <PublicDetail label="Typ" value={PROJECT_TYPE_LABELS[project.projectType]} /> : null}
                <PublicDetail label="Etap" value={STAGE_LABELS[project.stage]} />
                {project.commitment ? <PublicDetail label="Czas" value={COMMITMENT_LABELS[project.commitment]} /> : null}
                {project.collaborationMode ? <PublicDetail label="Tryb" value={COLLABORATION_MODE_LABELS[project.collaborationMode]} /> : null}
                {project.collaborationPace ? <PublicDetail label="Tempo" value={COLLABORATION_PACE_LABELS[project.collaborationPace]} /> : null}
                {project.duration ? <PublicDetail label="Horyzont" value={PROJECT_DURATION_LABELS[project.duration]} /> : null}
              </dl>
              {project.repositoryUrl || project.demoUrl || project.designUrl || project.docsUrl ? (
                <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Linki</p>
                  <div className="mt-2 space-y-2 text-sm">
                    {project.repositoryUrl ? <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Repozytorium</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.demoUrl ? <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Demo / landing</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.designUrl ? <a href={project.designUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Design / Figma</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    {project.docsUrl ? <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"><span>Dokumentacja</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Autor pomysłu</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar username={project.owner?.username ?? "Builder"} seed={project.owner?.userId ?? project.ownerId} />
                <div>
                  <p className="font-semibold">{project.owner?.username ?? "Builder"}</p>
                  <p className={`text-xs ${ownerActivity === "TODAY" ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"}`}>{activityLabel(project.owner?.lastActiveAt)}</p>
                </div>
              </div>
            </Card>

            {project.members.length ? (
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Ekipa</p>
                <div className="mt-3 space-y-3">
                  {project.members.slice(0, 8).map((member) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <Avatar username={member.profile?.username ?? "Builder"} seed={member.userId} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.profile?.username ?? "Builder"}</p>
                        <p className="text-xs text-neutral-400">{member.roleType ? ROLE_LABELS[member.roleType] : member.profile?.role ? ROLE_LABELS[member.profile.role] : "Współtwórca"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="border-lime-200 bg-lime-50/70 p-6 dark:border-lime-500/20 dark:bg-lime-500/5">
              <ShieldCheck className="h-5 w-5 text-lime-600" />
              <p className="mt-3 font-semibold">Wspólny projekt, nie zlecenie</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">BuildCrew pomaga znaleźć współtwórców. Ustalenia dotyczące współpracy, praw do kodu i ewentualnych rozliczeń ustalacie bezpośrednio między sobą.</p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PublicDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-neutral-400">{label}</dt><dd className="mt-0.5 text-neutral-800 dark:text-neutral-200">{value}</dd></div>;
}
