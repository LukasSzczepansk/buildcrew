import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ChallengeJoinPanel } from "@/components/challenges/challenge-join-panel";
import { ChallengeMatchCard } from "@/components/challenges/challenge-match-card";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { CHALLENGE_STATUS_LABELS } from "@/lib/constants";
import { getCrewById, getMembershipCrewForUser } from "@/server/data/crews";
import { getChallenge, getChallengeParticipantCount, getChallengeParticipation, listChallengeMatches, listShowcaseEntries } from "@/server/data/showcase";

export const metadata: Metadata = { title: "Build Challenge - BuildCrew" };
export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login"); const { id } = await params;
  const challenge = await getChallenge(id); if (!challenge) notFound();
  const [participation, count, crewId, entries] = await Promise.all([getChallengeParticipation(id, user.id), getChallengeParticipantCount(id), getMembershipCrewForUser(user.id), listShowcaseEntries({ challengeId: id, tab: "popular", viewerId: user.id })]);
  const crew = crewId ? await getCrewById(crewId) : null;
  const matches = participation?.mode === "FIND_CREW" && !participation.crewId ? await listChallengeMatches(id, user.id) : [];
  return <div><Topbar title={challenge.title} subtitle={challenge.prompt} /><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><div className="space-y-6"><Card className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge variant="warning">{CHALLENGE_STATUS_LABELS[challenge.status]}</Badge>{challenge.category ? <Badge variant="outline">{challenge.category}</Badge> : null}<span className="text-[13px] text-neutral-400">{count} uczestników</span></div>{challenge.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-600 dark:text-neutral-300">{challenge.description}</p> : null}<p className="mt-4 text-[13px] text-neutral-400">Budowanie: {challenge.startsAt.toLocaleString("pl-PL")} → {challenge.endsAt.toLocaleString("pl-PL")}</p></Card>{["OPEN","BUILDING"].includes(challenge.status) ? <ChallengeJoinPanel challengeId={id} participation={participation ? { mode: participation.mode, crewId: participation.crewId } : null} crews={crew ? [{ id: crew.id, label: `Crew · ${crew.members.map((member) => member.profile.username).join(", ")}` }] : []} /> : null}{matches.length ? <div><h2 className="text-lg font-semibold">Najlepsze dopasowania do Twojej ekipy</h2><p className="mt-1 text-sm text-neutral-500">To nie losowanie. Patrzymy na role, zainteresowania, dostępność, cele i poziom.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{matches.map((match) => <ChallengeMatchCard key={match.profile.userId} challengeId={id} candidate={{ userId: match.profile.userId, username: match.profile.username, avatarEmoji: match.profile.avatarEmoji, role: match.profile.role, score: match.score, reasons: match.reasons }} />)}</div></div> : null}<div><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Trophy className="h-5 w-5 text-amber-500" /> Projekty challenge</h2><p className="text-sm text-neutral-500">Ranking powstaje z reakcji i feedbacku społeczności.</p></div>{participation && ["BUILDING","VOTING"].includes(challenge.status) ? <Button asChild size="sm"><Link href="/showcase/new">Zgłoś projekt</Link></Button> : null}</div><div className="mt-4 grid gap-4 md:grid-cols-2">{entries.map((entry, index) => <div key={entry.id} className="relative">{challenge.status === "CLOSED" || challenge.status === "VOTING" ? <span className="absolute left-3 top-3 z-10 rounded-full bg-neutral-950/80 px-2.5 py-1 text-[13px] font-semibold text-white">#{index + 1}</span> : null}<ShowcaseCard currentUserId={user.id} entry={{ ...entry, viewerReactions: Array.from(entry.viewerReactions) }} /></div>)}</div>{!entries.length ? <p className="mt-6 rounded-[6px] border border-dashed p-8 text-center text-sm text-neutral-400">Jeszcze żadna ekipa nie opublikowała efektu.</p> : null}</div></div><div className="space-y-4"><Card className="p-5"><h3 className="font-semibold">Cel challenge</h3><p className="mt-2 text-sm text-neutral-500">Nie chodzi o perfekcyjny produkt. Chodzi o zebranie ekipy i dowiezienie czegoś, co da się pokazać.</p></Card><Button asChild variant="outline" className="w-full"><Link href="/showcase/challenges">← Wszystkie challenges</Link></Button></div></div></div>;
}
