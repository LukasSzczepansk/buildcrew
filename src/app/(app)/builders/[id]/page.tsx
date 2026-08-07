import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Globe, Link2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  COMMITMENT_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  LOOKING_FOR_LABELS,
  ROLE_LABELS,
} from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/server/data/profiles";
import { getRevealedContact } from "@/server/data/contact";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { BuilderProfileActions } from "@/components/builders/builder-profile-actions";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { getFriendshipState } from "@/server/data/friends";
import type { RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileByUserId(id);
  return { title: profile ? `${profile.username} — BuildCrew` : "Profil — BuildCrew" };
}

export default async function BuilderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (user.id !== id && await isBlockedEitherWay(user.id, id)) notFound();

  const profile = await getProfileByUserId(id);
  if (!profile) notFound();

  const [ownedProjects, memberProjects, contact] = await Promise.all([
    listProjectsForOwner(id),
    listProjectsForMember(id),
    user.id !== id ? getRevealedContact(user.id, id) : Promise.resolve(null),
  ]);
  const projects = [
    ...ownedProjects.map((p) => ({ ...p, relation: "Właściciel" })),
    ...memberProjects.filter((p) => p.ownerId !== id).map((p) => ({ ...p, relation: "Członek zespołu" })),
  ];

  const [myOwnedProjects, friendState] = user.id !== id
    ? await Promise.all([listProjectsForOwner(user.id), getFriendshipState(user.id, id)])
    : [[], { kind: "NONE" as const }];

  return (
    <div>
      <Topbar />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Avatar emoji={profile.avatarEmoji} size="xl" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{profile.username}</h1>
                <p className="text-neutral-500">{profile.role ? ROLE_LABELS[profile.role as RoleType] : "Builder"}</p>
              </div>
            </div>

            {profile.bio && <p className="mt-6 text-neutral-600 dark:text-neutral-300">{profile.bio}</p>}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Umiejętności</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Poziom</p>
                <Badge>{profile.level ? LEVEL_LABELS[profile.level] : "—"}</Badge>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Zainteresowania</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((i) => (
                    <Badge key={i} variant="secondary">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Cele</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.goals.map((g) => (
                    <Badge key={g} variant="secondary">
                      {GOAL_LABELS[g]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Dostępność</p>
                <p className="text-sm">⏱️ {profile.weeklyHours ? COMMITMENT_LABELS[profile.weeklyHours] : "—"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Aktualnie</p>
                <div className="flex flex-col gap-1 text-sm">
                  {profile.lookingFor.map((l) => (
                    <span key={l}>✓ {LOOKING_FOR_LABELS[l]}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {projects.length > 0 && (
            <Card className="mt-6 p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Projekty</p>
              <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                {projects.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between py-3 text-sm hover:text-violet-600">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-neutral-400">{p.relation}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {user.id !== id && (
            <BuilderProfileActions
              targetUserId={id}
              myProjects={myOwnedProjects.map((p) => ({ id: p.id, name: p.name }))}
              friendState={friendState}
            />
          )}

          {user.id !== id && contact && (
            <Card className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Kontakt</p>
              {contact.discordUsername ? (
                <div>
                  <p className="text-sm text-neutral-500">Discord</p>
                  <p className="font-mono font-medium">{contact.discordUsername}</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">Ta osoba nie podała jeszcze Discorda.</p>
              )}
            </Card>
          )}

          {(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl) && (
            <Card className="p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Linki</p>
              <div className="flex flex-col gap-2 text-sm">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-600 hover:underline dark:text-violet-400">
                    <Link2 className="h-4 w-4" /> GitHub
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-600 hover:underline dark:text-violet-400">
                    <Globe className="h-4 w-4" /> Portfolio
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-600 hover:underline dark:text-violet-400">
                    <Link2 className="h-4 w-4" /> LinkedIn
                  </a>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
