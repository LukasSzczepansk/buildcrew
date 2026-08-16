import type { Metadata } from "next";
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
      <ProjectWizard
        draftKey={user?.id ?? "session"}
        sourceIdeaId={canConvert ? sourceIdea!.id : undefined}
        initialData={canConvert ? { name: sourceIdea!.name, tagline: sourceIdea!.tagline, description: sourceIdea!.description, interests: sourceIdea!.interests } : undefined}
      />
    </div>
  );
}
