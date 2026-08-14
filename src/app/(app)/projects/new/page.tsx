import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProjectWizard } from "@/components/projects/project-wizard";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dodaj projekt — BuildCrew" };

export default async function NewProjectPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <Topbar title="Dodaj projekt" subtitle="Opisz projekt, ekipę i zasady współpracy bez zbędnego formularza." />
      <ProjectWizard draftKey={user?.id ?? "session"} />
    </div>
  );
}
