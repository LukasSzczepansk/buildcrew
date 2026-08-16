import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { CrewInviteDialog } from "@/components/crews/crew-invite-dialog";
import { labelsFor } from "@/lib/constants-i18n";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getCrewById } from "@/server/data/crews";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Your team - BuildCrew" : "Your team - BuildCrew" }; }

export default async function CrewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const locale = await getRequestLocale(); const en = locale === "en"; const labels = labelsFor(locale);
  const { id } = await params; const crew = await getCrewById(id); if (!crew) notFound();
  if (!crew.members.some((m) => m.userId === user.id)) notFound();
  const memberFullProfiles = await Promise.all(crew.members.map((m) => getProfileByUserId(m.userId)));
  const interestLists = memberFullProfiles.map((p) => p?.interests ?? []);
  const sharedInterests = interestLists.length > 0 ? interestLists.reduce<string[]>((acc, list) => acc.filter((i) => list.includes(i)), interestLists[0]) : [];
  let candidates: { userId: string; username: string; role: RoleType | null }[] = [];
  if (crew.status === "FORMING" && crew.members.length < 4) {
    const builders = await listBuilderProfiles(user.id); const memberIds = new Set(crew.members.map((m) => m.userId));
    candidates = builders.filter((b) => b.onboardingCompleted && b.lookingFor.includes("OPEN_TO_BUILD") && !memberIds.has(b.userId)).map((b) => ({ userId: b.userId, username: b.username, role: b.role as RoleType | null }));
  }
  return <div><Topbar title={en ? "Your team" : "Your team"} subtitle={en ? "Get to know each other, shape the idea and start building together." : "You are forming a team - talk, align, and build something together."} />
    <div className="grid gap-6 lg:grid-cols-3"><Card className="p-6 lg:col-span-2"><p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Team members" : "Team members"}</p><div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">{crew.members.map((m) => <div key={m.userId} className="flex items-center justify-between py-3"><Link href={`/builders/${m.userId}`} className="flex items-center gap-3"><Avatar username={m.profile.username} seed={m.userId} size="sm" /><div><p className="font-medium">{m.profile.username} {m.userId === user.id ? <span className="text-neutral-400">({en ? "You" : "You"})</span> : null}</p><p className="text-[13px] text-neutral-500">{m.profile.role ? labels.roles[m.profile.role as RoleType] : "Builder"}</p></div></Link></div>)}</div>{crew.status === "FORMING" && crew.members.length < 4 ? <div className="mt-5"><CrewInviteDialog crewId={crew.id} candidates={candidates} /></div> : null}</Card>
      <div className="flex flex-col gap-6"><Card className="p-6"><p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "What do you have in common?" : "What do you have in common?"}</p>{sharedInterests.length > 0 ? <div className="flex flex-wrap gap-1.5">{sharedInterests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}</div> : <p className="text-sm text-neutral-400">{en ? "No shared interests yet. Talk and find your overlap." : "No shared interests yet - talk and find some common ground."}</p>}</Card>
      <Card className="p-6"><p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{en ? "Already have an idea?" : "Already have an idea?"}</p>{crew.status === "CONVERTED_TO_PROJECT" && crew.projectId ? <div><p className="mb-3 text-sm text-neutral-500">{en ? "This team has already turned into a project." : "This team has already become a project."}</p><Button asChild className="w-full"><Link href={`/projects/${crew.projectId}`}>{en ? "View project" : "View project"}</Link></Button></div> : <div><p className="mb-3 text-sm text-neutral-500">{en ? "Create a project and start building." : "Create a project and start building."}</p><Button asChild className="w-full"><Link href={`/projects/new?crewId=${crew.id}`}>{en ? "Create project with this team" : "Create a project from this team"}</Link></Button></div>}</Card></div>
    </div>
  </div>;
}
