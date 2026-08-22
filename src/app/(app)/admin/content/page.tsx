import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MessageCircle, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/site-server";
import { deleteQuestionAdminAction } from "@/server/actions/admin";
import { listAdminQuestions } from "@/server/data/admin";

export const metadata: Metadata = { title: "Content - BuildCrew Admin" };

export default async function AdminContentPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const questions = await listAdminQuestions();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{en ? "Community content" : "Treści społeczności"}</h2>
        <p className="text-sm text-neutral-500">{en ? "Moderation of questions and answers published in Help." : "Moderacja pytań i odpowiedzi publikowanych w sekcji Pomoc."}</p>
      </div>
      <Card className="overflow-hidden">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {questions.map((q) => (
            <div key={q.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/help/${q.id}`} className="font-semibold hover:text-lime-600">{q.title}</Link>
                    {q.helpfulCount > 0 ? <Badge variant="success">{q.helpfulCount} {en ? "helpful" : "pomocnych"}</Badge> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{q.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-neutral-400">
                    <span className="inline-flex items-center gap-1.5"><Avatar username={q.username ?? q.email ?? (en ? "User" : "Użytkownik")} seed={q.authorId} size="sm" className="h-6 w-6 text-[11px]" />{q.username ?? q.email ?? (en ? "User" : "Użytkownik")}</span>
                    <span><MessageCircle className="mr-1 inline h-3.5 w-3.5" />{q.answerCount} {en ? "answers" : "odpowiedzi"}</span>
                    <span>{q.createdAt.toLocaleString(en ? "en-US" : "pl-PL")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/help/${q.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-[13px] font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"><ExternalLink className="h-3.5 w-3.5" /> {en ? "Open" : "Otwórz"}</Link>
                  <form action={deleteQuestionAdminAction}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <ConfirmSubmit message={en ? "Delete this question together with all answers?" : "Usunąć to pytanie razem ze wszystkimi odpowiedziami?"} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /> {en ? "Delete" : "Usuń"}</ConfirmSubmit>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {!questions.length ? <p className="p-10 text-center text-sm text-neutral-400">{en ? "No questions." : "Brak pytań."}</p> : null}
        </div>
      </Card>
    </div>
  );
}
