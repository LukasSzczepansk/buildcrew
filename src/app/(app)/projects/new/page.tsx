import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { ProjectWizard } from "@/components/projects/project-wizard";
import { getCurrentUser } from "@/lib/auth";
import { getIdeaById } from "@/server/data/projects";

export const metadata: Metadata = { title: "Dodaj projekt — BuildCrew" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const sourceIdea = user && params.fromIdea ? await getIdeaById(params.fromIdea, user.id) : null;
  const canConvert = Boolean(sourceIdea && sourceIdea.ownerId === user?.id);

  return (
    <div>
      <Topbar
        title={canConvert ? "Rozwiń pomysł w projekt" : "Dodaj projekt"}
        subtitle={canConvert ? "Pomysł jest już zapisany. Uzupełnij ekipę, stack i zasady współpracy." : "Opisz projekt, ekipę i zasady współpracy bez zbędnego formularza."}
      />
      {!canConvert ? (
        <div className="mb-6 flex flex-col gap-2 border-y border-[var(--bc-line)] py-4 text-[12px] text-[var(--bc-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Masz dopiero zalążek i nie chcesz jeszcze wypełniać całego projektu?</span>
          <Link href="/ideas" className="shrink-0 font-medium text-[var(--bc-ink)] hover:underline">Dodaj pomysł w mniej niż minutę →</Link>
        </div>
      ) : null}
      <ProjectWizard
        draftKey={user?.id ?? "session"}
        sourceIdeaId={canConvert ? sourceIdea!.id : undefined}
        initialData={canConvert ? { name: sourceIdea!.name, tagline: sourceIdea!.tagline, description: sourceIdea!.description, interests: sourceIdea!.interests } : undefined}
      />
    </div>
  );
}
