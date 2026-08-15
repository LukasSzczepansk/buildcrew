import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { QuestionForm } from "@/components/help/question-form";

export const metadata: Metadata = { title: "Zadaj pytanie - BuildCrew" };

export default function NewQuestionPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Topbar title="Zadaj pytanie" subtitle="Opisz problem tak, żeby inny builder mógł szybko Ci pomóc." />
      <Link href="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-lime-600">
        <ArrowLeft className="h-4 w-4" /> Wróć do pytań
      </Link>
      <QuestionForm />
    </div>
  );
}
