import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { CHALLENGE_STATUS_LABELS } from "@/lib/constants";
import { getChallengeParticipantCount, listChallenges } from "@/server/data/showcase";

export const metadata: Metadata = { title: "Build Challenges - BuildCrew" };
export default async function ChallengesPage() {
  await getCurrentUser();
  const challenges = await listChallenges();
  const items = await Promise.all(challenges.map(async (challenge) => ({ ...challenge, participants: await getChallengeParticipantCount(challenge.id) })));
  return <div><Topbar title="Build Challenges" subtitle="Nie masz pomysłu albo ekipy? Wejdź do wspólnego wyzwania, znajdź ludzi i dowieźcie coś działającego." /><div className="mb-5 rounded-lg border border-lime-200 bg-lime-50 p-5 dark:border-lime-500/20 dark:bg-lime-500/5"><p className="font-semibold">Jak to działa?</p><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Dołącz sam albo z Crew → znajdź dopasowanych builderów → buduj przez określony czas → pokaż efekt w Showcase → społeczność wybiera najciekawsze projekty.</p></div><div className="grid gap-5 md:grid-cols-2">{items.map((challenge) => <Card key={challenge.id} className="p-5"><div className="flex items-center justify-between gap-3"><Badge variant={challenge.status === "CLOSED" ? "secondary" : "warning"}>{CHALLENGE_STATUS_LABELS[challenge.status]}</Badge><span className="flex items-center gap-1 text-[13px] text-neutral-400"><UsersRound className="h-3.5 w-3.5" /> {challenge.participants} uczestników</span></div><h2 className="mt-3 text-lg font-semibold">{challenge.title}</h2><p className="mt-1 text-sm font-medium text-lime-600 dark:text-lime-400">{challenge.prompt}</p>{challenge.description ? <p className="mt-2 line-clamp-3 text-sm text-neutral-500">{challenge.description}</p> : null}<p className="mt-4 flex items-center gap-1.5 text-[13px] text-neutral-400"><CalendarDays className="h-3.5 w-3.5" /> {challenge.startsAt.toLocaleDateString("pl-PL")} - {challenge.endsAt.toLocaleDateString("pl-PL")}</p><Button asChild className="mt-4 w-full" variant={challenge.status === "CLOSED" ? "outline" : "default"}><Link href={`/showcase/challenges/${challenge.id}`}>{challenge.status === "CLOSED" ? "Zobacz wyniki" : "Zobacz challenge"}</Link></Button></Card>)}</div>{!items.length ? <p className="py-16 text-center text-sm text-neutral-400">Pierwszy Build Challenge pojawi się tutaj.</p> : null}</div>;
}
