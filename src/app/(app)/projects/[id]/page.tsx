import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { Topbar } from "@/components/layout/topbar";
import { ApplyDialog } from "@/components/projects/apply-dialog";
import { ShareProjectButton } from "@/components/projects/share-project-button";
import { CHARACTER_LABELS, COMMITMENT_LABELS, LEVEL_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/server/data/projects";
import { getProfileByUserId } from "@/server/data/profiles";
import { isBlockedEitherWay } from "@/server/data/moderation";
import type { Level, RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `${project.name} — BuildCrew` : "Projekt — BuildCrew" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  if (project.ownerId !== user.id && await isBlockedEitherWay(user.id, project.ownerId)) notFound();

  const [myProfile, ownerProfile] = await Promise.all([getProfileByUserId(user.id), project.owner ? getProfileByUserId(project.ownerId) : Promise.resolve(null)]);
  const isOwner = project.ownerId === user.id;
  const isMember = project.members.some((member) => member.userId === user.id);

  return (
    <div>
      <Topbar />

      <section className="border-b border-[var(--bc-line)] pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2.5"><h1 className="text-[30px] font-semibold tracking-[-0.035em]">{project.name}</h1><Badge variant="secondary">{STAGE_LABELS[project.stage]}</Badge></div><p className="bc-truncate-2 mt-2 max-w-[760px] text-[14px] leading-6 text-[var(--bc-muted)]">{project.tagline}</p></div>
          <div className="flex shrink-0 items-center gap-2"><ShareProjectButton projectId={project.id} projectName={project.name} projectTagline={project.tagline} openRoles={project.openRoles.map((role) => ({ id: role.id, roleType: role.roleType }))} compact /><Button asChild variant="outline" size="sm"><Link href={`/p/${project.id}`} target="_blank">Publiczny link <ExternalLink className="h-3.5 w-3.5" /></Link></Button></div>
        </div>
        {project.technologies.length ? <TechnologyStack items={project.technologies} max={8} compact className="mt-4" /> : null}
      </section>

      <div className="mt-5 flex items-start gap-2 border-l-2 border-amber-400 pl-3 text-[12px] leading-5 text-[var(--bc-muted)]"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p><span className="font-medium text-[var(--bc-ink)]">Bezpieczna współpraca:</span> nie wysyłaj pieniędzy, haseł ani sekretów API osobom poznanym na platformie.</p></div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <ProjectSection title="O projekcie"><p className="whitespace-pre-line text-[14px] leading-6 text-[var(--bc-muted)]">{project.description}</p>{project.ownerContribution ? <p className="mt-4 border-l-2 border-[var(--bc-line-strong)] pl-3 text-[13px] text-[var(--bc-muted)]"><span className="font-medium text-[var(--bc-ink)]">Wkład autora: </span>{project.ownerContribution}</p> : null}</ProjectSection>

          <ProjectSection title="Kogo szukamy">
            {project.roles.length === 0 ? <p className="text-[13px] text-[var(--bc-muted)]">Brak otwartych ról.</p> : <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{project.roles.map((role) => {
              const alreadyMember = project.members.some((member) => member.roleId === role.id && member.userId === user.id);
              return <div key={role.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-[14px] font-semibold">{ROLE_LABELS[role.roleType]}</p>{role.description ? <p className="mt-1 line-clamp-2 text-[12px] text-[var(--bc-muted)]">{role.description}</p> : null}<p className="mt-1 text-[11px] text-[var(--bc-faint)]">{role.open} {role.open === 1 ? "miejsce" : "miejsca"} · {role.preferredLevel ? LEVEL_LABELS[role.preferredLevel as Level] : "dowolny poziom"}</p></div><div className="shrink-0">{isOwner ? <Badge variant={role.open > 0 ? "success" : "secondary"}>{role.open > 0 ? "Otwarte" : "Obsadzone"}</Badge> : alreadyMember ? <Badge variant="success">Jesteś w ekipie</Badge> : role.open > 0 && myProfile ? <ApplyDialog projectId={project.id} roleId={role.id} roleType={role.roleType as RoleType} myProfile={{ role: myProfile.role as RoleType | null, skills: myProfile.skills, level: myProfile.level as Level | null, weeklyHours: myProfile.weeklyHours }} /> : <Badge variant="secondary">Obsadzone</Badge>}</div></div>;
            })}</div>}
          </ProjectSection>
        </main>

        <aside className="space-y-6">
          <SideSection title="Szczegóły"><dl className="space-y-3 text-[13px]"><Detail label="Etap" value={STAGE_LABELS[project.stage]} />{project.commitment ? <Detail label="Czas" value={COMMITMENT_LABELS[project.commitment]} /> : null}{project.goal ? <Detail label="Cel" value={project.goal} /> : null}{project.character.length ? <Detail label="Charakter" value={project.character.map((item) => CHARACTER_LABELS[item]).join(" · ")} /> : null}</dl></SideSection>
          {ownerProfile ? <SideSection title="Autor"><Link href={`/builders/${ownerProfile.userId}`} className="flex items-center gap-3"><Avatar username={ownerProfile.username} seed={ownerProfile.userId} size="sm" /><div><p className="text-[13px] font-medium">{ownerProfile.username}</p><p className="text-[11px] text-[var(--bc-muted)]">{ownerProfile.role ? ROLE_LABELS[ownerProfile.role as RoleType] : ""}</p></div></Link></SideSection> : null}
          <SideSection title="Ekipa"><div className="space-y-3">{project.members.map((member) => <Link key={member.userId} href={`/builders/${member.userId}`} className="flex items-center gap-3"><Avatar username={member.profile?.username ?? "Builder"} seed={member.userId} size="sm" /><div><p className="text-[13px] font-medium">{member.profile?.username ?? "Builder"}</p><p className="text-[11px] text-[var(--bc-muted)]">{member.isOwner ? "Autor" : member.roleType ? ROLE_LABELS[member.roleType] : "Członek"}</p></div></Link>)}</div></SideSection>
          {isOwner ? <Button asChild variant="outline" className="w-full"><Link href={`/projects/${project.id}/applications`}>Zgłoszenia</Link></Button> : null}
          {!isOwner && isMember ? <p className="text-[12px] text-[var(--bc-muted)]">Jesteś członkiem tej ekipy.</p> : null}
        </aside>
      </div>
    </div>
  );
}

function ProjectSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-b border-[var(--bc-line)] py-6 first:pt-0"><h2 className="mb-3 text-[16px] font-semibold">{title}</h2>{children}</section>; }
function SideSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-b border-[var(--bc-line)] pb-5"><h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{title}</h2>{children}</section>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-[11px] text-[var(--bc-faint)]">{label}</dt><dd className="mt-0.5 leading-5 text-[var(--bc-ink)]">{value}</dd></div>; }
