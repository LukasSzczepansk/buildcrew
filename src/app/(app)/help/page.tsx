import type { Metadata } from "next";
import Link from "next/link";
import { Plus, MessagesSquare } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listQuestions } from "@/server/data/help";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Help - BuildCrew" : "Help - BuildCrew" };
}

export default async function HelpPage() {
  const user = await getCurrentUser();
  const locale = await getRequestLocale();
  const en = locale === "en";
  const questions = await listQuestions(user?.id);

  return (
    <div>
      <Topbar title={en ? "Help" : "Help"} subtitle={en ? "Stuck on something? Ask other builders." : "Stuck? Ask other builders."} />
      <div className="mb-5 flex justify-end"><Button asChild size="sm"><Link href="/help/new"><Plus className="h-4 w-4" /> {en ? "Ask a question" : "Ask a question"}</Link></Button></div>
      {questions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessagesSquare className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-4 font-semibold">{en ? "No questions yet" : "No questions yet"}</h2>
          <p className="mt-1 text-sm text-[var(--bc-muted)]">{en ? "Be the first person to ask the community." : "You can be the first person to ask something."}</p>
          <Button asChild className="mt-5"><Link href="/help/new">{en ? "Ask the first question" : "Ask the first question"}</Link></Button>
        </Card>
      ) : (
        <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
          {questions.map((question) => (
            <Link key={question.id} href={`/help/${question.id}`}>
              <div className="px-1 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold tracking-tight text-[var(--bc-ink)]">{question.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--bc-muted)]">{question.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {question.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--bc-faint)]"><Avatar username={question.author?.username ?? "Builder"} seed={question.author?.userId ?? question.authorId} size="sm" className="h-6 w-6 text-[11px]" />{question.author?.username ?? "Builder"} · {timeAgo(question.createdAt, locale)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-[6px] bg-neutral-50 px-3 py-2 text-center dark:bg-neutral-800"><p className="text-lg font-semibold">{question.answerCount}</p><p className="text-[12px] text-[var(--bc-faint)]">{en ? (question.answerCount === 1 ? "answer" : "answers") : "answers"}</p></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
