import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProjectWizard } from "@/components/projects/project-wizard";

export const metadata: Metadata = { title: "Dodaj projekt — BuildCrew" };

export default function NewProjectPage() {
  return (
    <div>
      <Topbar title="Dodaj projekt" subtitle="Opisz co budujecie i kogo szukacie." />
      <ProjectWizard />
    </div>
  );
}
