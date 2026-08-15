import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageSquareText, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { ShowcaseFeedbackForm } from "@/components/showcase/feedback-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { SHOWCASE_CATEGORY_LABELS, SHOWCASE_STATUS_LABELS } from "@/lib/constants";
import { getShowcaseEntry, listShowcaseFeedback } from "@/server/data/showcase";

export const metadata: Metadata = { title: "Showcase - BuildCrew" };
export default async function ShowcaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); const { id } = await params;
  const entry = await getShowcaseEntry(id, user?.id); if (!entry) notFound();
  const feedback = await listShowcaseFeedback(id);
  return <div><Topbar title={entry.title} subtitle={entry.tagline} />
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <ShowcaseCard currentUserId={user?.id} entry={{ ...entry, viewerReactions: Array.from(entry.viewerReactions) }} />
        <Card className="p-6"><h2 className="text-lg font-semibold">O projekcie</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-600 dark:text-neutral-300">{entry.description}</p><div className="mt-5 flex flex-wrap gap-2"><Badge>{SHOWCASE_CATEGORY_LABELS[entry.category]}</Badge><Badge variant="secondary">{SHOWCASE_STATUS_LABELS[entry.status]}</Badge>{entry.challenge ? <Button asChild size="sm" variant="outline"><Link href={`/showcase/challenges/${entry.challengeId}`}>🏁 {entry.challenge.title}</Link></Button> : null}</div></Card>
        <Card className="p-6"><div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-lime-600" /><h2 className="text-lg font-semibold">Konstruktywny feedback</h2></div>{user && user.id !== entry.creatorId ? <div className="mt-5"><ShowcaseFeedbackForm entryId={entry.id} /></div> : <p className="mt-3 text-sm text-neutral-500">{user ? "To Twój projekt - tutaj zobaczysz opinie społeczności." : "Zaloguj się, żeby dać feedback."}</p>}</Card>
        {feedback.length ? <div className="space-y-3">{feedback.map((item) => <Card key={item.id} className="p-5"><div className="flex items-center gap-3"><Avatar username={item.username} seed={item.userId} size="sm" /><div><Link href={`/builders/${item.userId}`} className="text-sm font-semibold hover:underline">{item.username}</Link><p className="text-[13px] text-neutral-400">Czy używałby: {item.wouldUse === "YES" ? "Tak" : item.wouldUse === "MAYBE" ? "Może" : "Nie"}</p></div></div>{item.liked ? <p className="mt-3 text-sm"><span className="font-medium">👍 Co działa:</span> {item.liked}</p> : null}{item.improve ? <p className="mt-2 text-sm"><span className="font-medium">🛠 Co poprawić:</span> {item.improve}</p> : null}</Card>)}</div> : null}
      </div>
      <div className="space-y-5">
        <Card className="p-5"><h3 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> Twórcy</h3><div className="mt-4 space-y-3">{entry.team.map((member) => <Link key={member.userId} href={`/builders/${member.userId}`} className="flex items-center gap-3"><Avatar username={member.username} seed={member.userId} size="sm" /><span className="text-sm font-medium">{member.username}</span></Link>)}</div></Card>
        {entry.lookingForCollaborators ? <Card className="border-lime-200 bg-lime-50/60 p-5 dark:border-lime-500/20 dark:bg-lime-500/5"><h3 className="font-semibold text-lime-800 dark:text-lime-300">Ekipa nadal rośnie</h3><p className="mt-2 text-sm text-lime-700/80 dark:text-lime-300/80">{entry.lookingForText || "Twórcy są otwarci na kolejnych współtwórców."}</p>{entry.projectId ? <Button asChild className="mt-4 w-full"><Link href={`/projects/${entry.projectId}`}>Chcę dołączyć</Link></Button> : entry.creator ? <Button asChild className="mt-4 w-full"><Link href={`/builders/${entry.creator.userId}`}>Poznaj twórcę</Link></Button> : null}</Card> : null}
        <Card className="p-5"><h3 className="font-semibold">Linki</h3><div className="mt-3 flex flex-col gap-2">{entry.liveUrl ? <Button asChild variant="outline"><a href={entry.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Otwórz projekt</a></Button> : null}{entry.githubUrl ? <Button asChild variant="outline"><a href={entry.githubUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> GitHub</a></Button> : null}</div></Card>
      </div>
    </div>
  </div>;
}
