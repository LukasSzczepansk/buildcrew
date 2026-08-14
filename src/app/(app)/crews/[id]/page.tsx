import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { CrewInviteDialog } from "@/components/crews/crew-invite-dialog";
import { ROLE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getCrewById } from "@/server/data/crews";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Wasza ekipa — BuildCrew" };

export default async function CrewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const crew = await getCrewById(id);
  if (!crew) notFound();
  const isMember = crew.members.some((m) => m.userId === user.id);
  if (!isMember) notFound();

  const memberFullProfiles = await Promise.all(crew.members.map((m) => getProfileByUserId(m.userId)));
  const interestLists = memberFullProfiles.map((p) => p?.interests ?? []);
  const sharedInterests =
    interestLists.length > 0
      ? interestLists.reduce<string[]>((acc, list) => acc.filter((i) => list.includes(i)), interestLists[0])
      : [];

  let candidates: { userId: string; username: string; role: RoleType | null }[] = [];
  if (crew.status === "FORMING" && crew.members.length < 4) {
    const builders = await listBuilderProfiles(user.id);
    const memberIds = new Set(crew.members.map((m) => m.userId));
    candidates = builders
      .filter((b) => b.onboardingCompleted && b.lookingFor.includes("OPEN_TO_BUILD") && !memberIds.has(b.userId))
      .map((b) => ({ userId: b.userId, username: b.username, role: b.role as RoleType | null }));
  }

  return (
    <div>
      <Topbar title="Wasza ekipa" subtitle="Formujecie się, rozmawiajcie i zbudujcie coś razem." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Członkowie ekipy</p>
          <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
            {crew.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between py-3">
                <Link href={`/builders/${m.userId}`} className="flex items-center gap-3">
                  <Avatar username={m.profile.username} seed={m.userId} size="sm" />
                  <div>
                    <p className="font-medium">
                      {m.profile.username} {m.userId === user.id && <span className="text-neutral-400">(Ty)</span>}
                    </p>
                    <p className="text-xs text-neutral-500">{m.profile.role ? ROLE_LABELS[m.profile.role as RoleType] : "Builder"}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {crew.status === "FORMING" && crew.members.length < 4 && (
            <div className="mt-5">
              <CrewInviteDialog crewId={crew.id} candidates={candidates} />
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Co Was łączy?</p>
            {sharedInterests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sharedInterests.map((i) => (
                  <Badge key={i} variant="secondary">
                    {i}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Brak wspólnych zainteresowań — porozmawiajcie, żeby je znaleźć!</p>
            )}
          </Card>

          <Card className="p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Macie już pomysł?</p>
            {crew.status === "CONVERTED_TO_PROJECT" && crew.projectId ? (
              <div>
                <p className="mb-3 text-sm text-neutral-500">Ta ekipa zamieniła się już w projekt.</p>
                <Button asChild className="w-full">
                  <Link href={`/projects/${crew.projectId}`}>Zobacz projekt</Link>
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-neutral-500">Stwórzcie projekt i zacznijcie budować.</p>
                <Button asChild className="w-full">
                  <Link href={`/projects/new?crewId=${crew.id}`}>Utwórz projekt z tej ekipy</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
