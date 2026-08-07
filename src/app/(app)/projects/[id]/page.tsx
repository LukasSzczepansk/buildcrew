import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { ApplyDialog } from "@/components/projects/apply-dialog";
import {
  CHARACTER_LABELS,
  COMMITMENT_LABELS,
  LEVEL_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
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

  const [myProfile, ownerProfile] = await Promise.all([
    getProfileByUserId(user.id),
    project.owner ? getProfileByUserId(project.ownerId) : Promise.resolve(null),
  ]);
  const isOwner = project.ownerId === user.id;
  const isMember = project.members.some((m) => m.userId === user.id);

  return (
    <div>
      <Topbar />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p><span className="font-semibold">Bezpieczna współpraca:</span> BuildCrew nie pośredniczy w płatnościach ani zatrudnieniu. Nie wysyłaj pieniędzy, haseł, kodów 2FA ani sekretów API osobom poznanym na platformie.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-neutral-500">{project.tagline}</p>
              </div>
              <Badge variant="secondary" className="whitespace-nowrap">
                {STAGE_LABELS[project.stage]}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.interests.map((i) => (
                <Badge key={i} variant="secondary">
                  {i}
                </Badge>
              ))}
              {project.commitment && <Badge variant="outline">{COMMITMENT_LABELS[project.commitment]}</Badge>}
            </div>

            <p className="mt-6 whitespace-pre-line text-neutral-600 dark:text-neutral-300">{project.description}</p>

            {project.ownerContribution && (
              <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Co robi właściciel</p>
                <p>{project.ownerContribution}</p>
              </div>
            )}
          </Card>

          <Card className="mt-6 p-8">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Kogo szukamy?</h2>
            {project.roles.length === 0 ? (
              <p className="text-sm text-neutral-400">Brak otwartych ról.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {project.roles.map((role) => {
                  const alreadyMember = project.members.some((m) => m.roleId === role.id && m.userId === user.id);
                  return (
                    <div
                      key={role.id}
                      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700"
                    >
                      <div>
                        <p className="font-medium">{ROLE_LABELS[role.roleType]}</p>
                        {role.description && <p className="mt-0.5 text-sm text-neutral-500">{role.description}</p>}
                        <p className="mt-1 text-xs text-neutral-400">
                          {role.open} {role.open === 1 ? "miejsce" : "miejsca"} · Poziom: {role.preferredLevel ? LEVEL_LABELS[role.preferredLevel as Level] : "dowolny"}
                        </p>
                      </div>
                      {isOwner ? (
                        <Badge variant={role.open > 0 ? "success" : "secondary"}>{role.open > 0 ? "Otwarte" : "Obsadzone"}</Badge>
                      ) : alreadyMember ? (
                        <Badge variant="success">Jesteś w zespole</Badge>
                      ) : role.open > 0 && myProfile ? (
                        <ApplyDialog
                          projectId={project.id}
                          roleId={role.id}
                          roleType={role.roleType as RoleType}
                          myProfile={{
                            role: myProfile.role as RoleType | null,
                            skills: myProfile.skills,
                            level: myProfile.level as Level | null,
                            weeklyHours: myProfile.weeklyHours,
                          }}
                        />
                      ) : (
                        <Badge variant="secondary">Obsadzone</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Szczegóły</p>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-neutral-400">Etap</dt>
                <dd>{STAGE_LABELS[project.stage]}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Technologie</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </dd>
              </div>
              {project.goal && (
                <div>
                  <dt className="text-neutral-400">Cel</dt>
                  <dd>{project.goal}</dd>
                </div>
              )}
              {project.character.length > 0 && (
                <div>
                  <dt className="text-neutral-400">Charakter</dt>
                  <dd>{project.character.map((c) => CHARACTER_LABELS[c]).join(" / ")}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Właściciel</p>
            {ownerProfile && (
              <Link href={`/builders/${ownerProfile.userId}`} className="flex items-center gap-3">
                <Avatar emoji={ownerProfile.avatarEmoji} size="sm" />
                <div>
                  <p className="font-medium">{ownerProfile.username}</p>
                  <p className="text-xs text-neutral-500">{ownerProfile.role ? ROLE_LABELS[ownerProfile.role as RoleType] : ""}</p>
                </div>
              </Link>
            )}
          </Card>

          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Zespół</p>
            <div className="flex flex-col gap-3">
              {project.members.map((m) => (
                <Link key={m.userId} href={`/builders/${m.userId}`} className="flex items-center gap-3">
                  <Avatar emoji={m.profile?.avatarEmoji ?? "🙂"} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{m.profile?.username ?? "Builder"}</p>
                    <p className="text-xs text-neutral-500">{m.isOwner ? "Właściciel" : m.roleType ? ROLE_LABELS[m.roleType] : "Członek"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {isOwner && (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/projects/${project.id}/applications`}>Zobacz zgłoszenia</Link>
            </Button>
          )}
          {!isOwner && isMember && (
            <Card className="p-6">
              <p className="text-sm text-neutral-500">Jesteś w tym zespole — sprawdź profil właściciela, aby znaleźć kontakt.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
