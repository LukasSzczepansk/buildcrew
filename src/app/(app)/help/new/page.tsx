import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { QuestionForm } from "@/components/help/question-form";
import { getRequestLocale } from "@/lib/site-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Ask a question - BuildCrew" : "Zadaj pytanie - BuildCrew" };
}

export default async function NewQuestionPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  return <div className="mx-auto max-w-3xl"><Topbar title={en ? "Ask a question" : "Zadaj pytanie"} subtitle={en ? "Describe the problem so another builder can help quickly." : "Opisz problem tak, żeby inny builder mógł szybko Ci pomóc."} /><Link href="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-lime-600"><ArrowLeft className="h-4 w-4" /> {en ? "Back to questions" : "Wróć do pytań"}</Link><QuestionForm /></div>;
}
