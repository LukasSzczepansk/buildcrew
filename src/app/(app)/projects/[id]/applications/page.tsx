import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ApplicationCard } from "@/components/projects/application-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getProjectById } from "@/server/data/projects";
import { listApplicationsForProject } from "@/server/data/applications";
import { getProfileByUserId } from "@/server/data/profiles";
import type { RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Applications - BuildCrew" : "Zgłoszenia - BuildCrew" }; }

export default async function ProjectApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login"); const locale = await getRequestLocale(); const en = locale === "en"; const { id } = await params;
  const project = await getProjectById(id); if (!project) notFound(); if (project.ownerId !== user.id) redirect(`/projects/${id}`);
  const applications = await listApplicationsForProject(id); const skillsByApplicant = new Map<string, string[]>();
  await Promise.all(Array.from(new Set(applications.map((a) => a.applicant.userId))).map(async (applicantId) => { const profile = await getProfileByUserId(applicantId); skillsByApplicant.set(applicantId, profile?.skills ?? []); }));
  const pendingCount = applications.filter((application) => application.status === "PENDING").length;
  return <div><Topbar title={en ? `Applications - ${project.name}` : `Zgłoszenia - ${project.name}`} subtitle={en ? `${pendingCount} ${pendingCount === 1 ? "person is" : "people are"} waiting for a decision. See what they could bring to the team.` : `${pendingCount} ${pendingCount === 1 ? "osoba czeka" : "osoby czekają"} na decyzję. Zobacz, co mogą wnieść do zespołu.`} />
    {applications.length === 0 ? <EmptyState icon="📭" title={en ? "No applications yet." : "Nikt jeszcze nie wysłał zgłoszenia."} description={en ? "You can actively find builders and invite them to your project." : "Możesz aktywnie znaleźć ludzi i zaprosić ich do projektu."} ctaLabel={en ? "Find builders" : "Znajdź builderów"} ctaHref="/builders" /> : <div className="flex flex-col gap-4">{applications.map((a) => { const applicantSkills = skillsByApplicant.get(a.applicant.userId) ?? []; const targetSkills = a.role.skills.length ? a.role.skills : project.technologies; const overlap = applicantSkills.filter((skill) => targetSkills.includes(skill)); let matchScore = Math.min(30, overlap.length * 10); const reasons: string[] = []; if (overlap.length) reasons.push(en ? `Matching skills: ${overlap.slice(0, 3).join(", ")}` : `Pasujące umiejętności: ${overlap.slice(0, 3).join(", ")}`); if (a.applicant.role === a.role.roleType || a.applicant.role === "FULLSTACK") { matchScore += 40; reasons.push(en ? "Role matches the open position" : "Twoja rola pasuje do otwartej pozycji"); } if (a.role.preferredLevel && a.applicant.level === a.role.preferredLevel) { matchScore += 15; reasons.push(en ? "Experience level matches" : "Pasuje poziom doświadczenia"); } if (project.commitment && a.applicant.weeklyHours === project.commitment) { matchScore += 15; reasons.push(en ? "Similar availability" : "Podobna dostępność"); } return <ApplicationCard key={a.id} application={{ id: a.id, status: a.status, message: a.message, role: { roleType: a.role.roleType as RoleType }, matchScore: Math.min(100, matchScore), reasons, applicant: { userId: a.applicant.userId, username: a.applicant.username, avatarEmoji: a.applicant.avatarEmoji, level: a.applicant.level, weeklyHours: a.applicant.weeklyHours, skills: applicantSkills } }} />; })}</div>}
  </div>;
}
