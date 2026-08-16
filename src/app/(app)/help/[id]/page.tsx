import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AnswerForm } from "@/components/help/answer-form";
import { HelpfulButton } from "@/components/help/helpful-button";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { timeAgo } from "@/lib/utils";
import { getQuestionById } from "@/server/data/help";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Question - BuildCrew" : "Pytanie - BuildCrew" }; }

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const locale = await getRequestLocale(); const en = locale === "en";
  const { id } = await params; const question = await getQuestionById(id, user.id); if (!question) notFound();
  return <div className="mx-auto max-w-4xl"><Topbar /><Link href="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-lime-600"><ArrowLeft className="h-4 w-4" /> {en ? "Back to questions" : "Wróć do pytań"}</Link>
    <Card className="p-6 sm:p-7"><div className="flex items-start gap-3"><Avatar username={question.author?.username ?? "Builder"} seed={question.authorId} size="md" /><div className="min-w-0 flex-1"><p className="text-sm text-neutral-500">{question.author?.username ?? "Builder"} · {timeAgo(question.createdAt, locale)}</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{question.title}</h1><div className="mt-3 flex flex-wrap gap-2">{question.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-neutral-700 dark:text-neutral-300">{question.description}</p></div></div></Card>
    <div className="mt-7 flex items-center justify-between"><h2 className="text-lg font-semibold">{en ? `Answers (${question.answers.length})` : `Odpowiedzi (${question.answers.length})`}</h2></div>
    <div className="mt-3 grid gap-3">{question.answers.length === 0 ? <Card className="p-6 text-sm text-neutral-500">{en ? "No one has answered yet. You can be the first." : "Nikt jeszcze nie odpowiedział. Możesz być pierwszy."}</Card> : question.answers.map((answer) => <Card key={answer.id} className={answer.isHelpful ? "border-emerald-200 p-5 dark:border-emerald-500/30" : "p-5"}><div className="flex items-start gap-3"><Avatar username={answer.author?.username ?? "Builder"} seed={answer.authorId} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{answer.author?.username ?? "Builder"}</p><span className="text-[13px] text-neutral-400">{timeAgo(answer.createdAt, locale)}</span>{answer.isHelpful ? <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> {en ? "Helped the author" : "Pomogło autorowi"}</Badge> : null}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">{answer.body}</p>{question.authorId === user.id && !answer.isHelpful ? <div className="mt-4"><HelpfulButton answerId={answer.id} questionId={question.id} /></div> : null}</div></div></Card>)}</div>
    <Card className="mt-6 p-6"><h2 className="font-semibold">{en ? "Add an answer" : "Dodaj odpowiedź"}</h2><p className="mb-4 mt-1 text-sm text-neutral-500">{en ? "Keep it concise. You can include steps, code or a direction to explore." : "Krótko i konkretnie. Możesz podać kroki, kod albo kierunek rozwiązania."}</p><AnswerForm questionId={question.id} /></Card>
  </div>;
}
