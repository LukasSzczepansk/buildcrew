import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ApplicationCard } from "@/components/projects/application-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/server/data/projects";
import { listApplicationsForProject } from "@/server/data/applications";
import { getProfileByUserId } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Zgłoszenia — BuildCrew" };

export default async function ProjectApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();
  if (project.ownerId !== user.id) redirect(`/projects/${id}`);

  const applications = await listApplicationsForProject(id);
  const skillsByApplicant = new Map<string, string[]>();
  await Promise.all(
    Array.from(new Set(applications.map((a) => a.applicant.userId))).map(async (applicantId) => {
      const profile = await getProfileByUserId(applicantId);
      skillsByApplicant.set(applicantId, profile?.skills ?? []);
    }),
  );

  return (
    <div>
      <Topbar title={`Zgłoszenia — ${project.name}`} subtitle="Przejrzyj osoby, które chcą dołączyć do projektu." />

      {applications.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Jeszcze nikt się nie zgłosił."
          description="Możesz aktywnie znaleźć builderów i zaprosić ich do projektu."
          ctaLabel="Znajdź builderów"
          ctaHref="/builders"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((a) => (
            <ApplicationCard
              key={a.id}
              application={{
                id: a.id,
                status: a.status,
                message: a.message,
                role: { roleType: a.role.roleType as RoleType },
                applicant: {
                  userId: a.applicant.userId,
                  username: a.applicant.username,
                  avatarEmoji: a.applicant.avatarEmoji,
                  level: a.applicant.level,
                  weeklyHours: a.applicant.weeklyHours,
                  skills: [],
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
