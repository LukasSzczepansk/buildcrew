import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { ProjectWizard } from "@/components/projects/project-wizard";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getIdeaById } from "@/server/data/projects";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Add project - BuildCrew" : "Dodaj projekt - BuildCrew" };
}

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  const locale = await getRequestLocale();
  const en = locale === "en";
  const params = await searchParams;
  const sourceIdea = user && params.fromIdea ? await getIdeaById(params.fromIdea, user.id) : null;
  const canConvert = Boolean(sourceIdea && sourceIdea.ownerId === user?.id);

  return (
    <div>
      <Topbar
        title={canConvert ? (en ? "Turn the idea into a project" : "Rozwiń pomysł w projekt") : (en ? "Add project" : "Dodaj projekt")}
        subtitle={canConvert ? (en ? "The idea is already saved. Add the team, stack and collaboration expectations." : "Pomysł jest już zapisany. Uzupełnij ekipę, stack i zasady współpracy.") : (en ? "Describe the project, team and collaboration expectations without unnecessary formality." : "Opisz projekt, ekipę i zasady współpracy bez zbędnego formularza.")}
      />
      {!canConvert ? (
        <div className="mb-6 flex flex-col gap-2 border-y border-[var(--bc-line)] py-4 text-[13px] text-[var(--bc-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>{en ? "Only have an early concept and don’t want to fill in the full project yet?" : "Masz dopiero zalążek i nie chcesz jeszcze wypełniać całego projektu?"}</span>
          <Link href="/ideas" className="shrink-0 font-medium text-[var(--bc-ink)] hover:underline">{en ? "Add an idea in under a minute →" : "Dodaj pomysł w mniej niż minutę →"}</Link>
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
