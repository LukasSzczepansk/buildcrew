import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ApplicationCard } from "@/components/projects/application-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { computeTeamFit, type FitCandidate, type FitTeamMember } from "@/lib/team-fit";
import { getProjectById } from "@/server/data/projects";
import { listApplicationsForProject } from "@/server/data/applications";
import { trialStatusByApplicant } from "@/server/data/trial-tasks";
import { getProfileByUserId } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Applications - BuildCrew" : "Zgłoszenia - BuildCrew" };
}

export default async function ProjectApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  if (project.ownerId !== user.id) redirect(`/projects/${id}`);

  const [applications, trialStatuses] = await Promise.all([listApplicationsForProject(id), trialStatusByApplicant(id)]);

  // Profiles (with skills) of applicants and of the current team, fetched once each.
  const profileIds = Array.from(new Set([...applications.map((item) => item.applicant.userId), ...project.members.map((member) => member.userId)]));
  const profiles = new Map<string, NonNullable<Awaited<ReturnType<typeof getProfileByUserId>>>>();
  await Promise.all(profileIds.map(async (userId) => {
    const profile = await getProfileByUserId(userId);
    if (profile) profiles.set(userId, profile);
  }));

  const team: FitTeamMember[] = project.members.map((member) => {
    const profile = profiles.get(member.userId);
    return { role: (member.roleType ?? profile?.role ?? null) as RoleType | null, level: profile?.level ?? null, skills: profile?.skills ?? [] };
  });
  const fitProject = {
    commitment: project.commitment,
    technologies: project.technologies,
    projectLanguage: project.projectLanguage,
    country: project.country,
    collaborationMode: project.collaborationMode,
    marketScope: project.marketScope,
    roles: project.roles.map((role) => ({ id: role.id, slots: role.slots, filled: role.filled })),
  };

  const rows = applications.map((application) => {
    const profile = profiles.get(application.applicant.userId);
    const candidate: FitCandidate = {
      role: (profile?.role ?? application.applicant.role ?? null) as RoleType | null,
      level: application.applicant.level,
      weeklyHours: application.applicant.weeklyHours,
      skills: profile?.skills ?? [],
      languages: profile?.languages ?? [],
      country: profile?.country ?? null,
      workModePreference: profile?.workModePreference ?? null,
    };
    const fit = computeTeamFit(candidate, { roleType: application.role.roleType, preferredLevel: application.role.preferredLevel, skills: application.role.skills }, application.role.id, team, fitProject, locale);
    return { application, candidate, fit };
  });

  // Undecided applications first, best team fit on top; decided ones keep their order below.
  const ranked = [...rows].sort((a, b) => {
    const aPending = a.application.status === "PENDING" ? 1 : 0;
    const bPending = b.application.status === "PENDING" ? 1 : 0;
    return bPending - aPending || (aPending ? b.fit.score - a.fit.score : 0);
  });
  const pendingCount = rows.filter((row) => row.application.status === "PENDING").length;

  return (
    <div>
      <Topbar
        title={en ? `Applications - ${project.name}` : `Zgłoszenia - ${project.name}`}
        subtitle={en
          ? `${pendingCount} ${pendingCount === 1 ? "person is" : "people are"} waiting for a decision. Ranked by how well they fit your current team.`
          : `${pendingCount} ${pendingCount === 1 ? "osoba czeka" : "osoby czekają"} na decyzję. Posortowane według dopasowania do Twojego zespołu.`}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="📭"
          title={en ? "No applications yet." : "Nikt jeszcze nie wysłał zgłoszenia."}
          description={en ? "You can actively find builders and invite them to your project." : "Możesz aktywnie znaleźć ludzi i zaprosić ich do projektu."}
          ctaLabel={en ? "Find builders" : "Znajdź builderów"}
          ctaHref="/builders"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {ranked.map(({ application, candidate, fit }) => (
            <ApplicationCard
              key={application.id}
              application={{
                id: application.id,
                status: application.status,
                message: application.message,
                trial: trialStatuses.get(`${application.applicant.userId}:${application.role.id}`),
                role: { roleType: application.role.roleType as RoleType },
                matchScore: fit.score,
                reasons: fit.reasons,
                fit: { cautions: fit.cautions, completeness: fit.completeness, newSkills: fit.newSkills },
                applicant: {
                  userId: application.applicant.userId,
                  username: application.applicant.username,
                  avatarEmoji: application.applicant.avatarEmoji,
                  level: application.applicant.level,
                  weeklyHours: application.applicant.weeklyHours,
                  skills: candidate.skills,
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
