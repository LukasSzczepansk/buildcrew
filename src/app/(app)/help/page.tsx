import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleQuestion, Plus, MessagesSquare } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { listQuestions } from "@/server/data/help";

export const metadata: Metadata = { title: "Pomoc — BuildCrew" };

export default async function HelpPage() {
  const user = await getCurrentUser();
  const questions = await listQuestions(user?.id);

  return (
    <div>
      <Topbar title="Pomoc" subtitle="Utknąłeś? Zapytaj innych builderów." />

      <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-lime-100 bg-lime-50/60 p-5 dark:border-lime-500/20 dark:bg-lime-500/5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-white text-lime-600  dark:bg-neutral-900">
            <MessageCircleQuestion className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Masz konkretny problem?</p>
            <p className="mt-1 text-sm text-neutral-500">Dodaj pytanie z tagami technologii. Odpowiedzi są publiczne dla społeczności.</p>
          </div>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/help/new"><Plus className="h-4 w-4" /> Zadaj pytanie</Link>
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessagesSquare className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-4 font-semibold">Nie ma jeszcze pytań</h2>
          <p className="mt-1 text-sm text-neutral-500">Możesz być pierwszą osobą, która o coś zapyta.</p>
          <Button asChild className="mt-5"><Link href="/help/new">Zadaj pierwsze pytanie</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {questions.map((question) => (
            <Link key={question.id} href={`/help/${question.id}`}>
              <Card className="p-5 transition-all hover:border-lime-200 hover:shadow-md dark:hover:border-lime-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{question.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{question.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {question.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      <span className="text-xs text-neutral-400">{question.author?.avatarEmoji} {question.author?.username ?? "Builder"} · {timeAgo(question.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-[6px] bg-neutral-50 px-3 py-2 text-center dark:bg-neutral-800">
                    <p className="text-lg font-semibold">{question.answerCount}</p>
                    <p className="text-[11px] text-neutral-400">odpowiedzi</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
