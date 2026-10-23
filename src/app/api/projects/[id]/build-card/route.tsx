import { getProjectById } from "@/server/data/projects";
import { listProjectCredits } from "@/server/data/social-projects";
import { renderBuildCard } from "@/lib/build-card";
import { isUuid } from "@/lib/security";

export const runtime = "nodejs";

/**
 * "Build card": a shareable 1200x627 (LinkedIn ratio) image for one contributor of a COMPLETED project.
 *   /api/projects/<projectId>/build-card?credit=<creditId>[&download=1][&lang=en]
 * Only completed projects have cards, and the credit must belong to that project. The data shown
 * (project, role, team names) is already public on /p/<id> for completed projects.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const creditId = url.searchParams.get("credit") ?? "";
  if (!isUuid(creditId)) return new Response("Not found", { status: 404 });

  const project = await getProjectById(id);
  if (!project || project.lifecycleStatus !== "COMPLETED") return new Response("Not found", { status: 404 });

  const credits = await listProjectCredits(project.id);
  const credit = credits.find((item) => item.id === creditId);
  if (!credit) return new Response("Not found", { status: 404 });

  const lang = url.searchParams.get("lang");
  const locale = lang === "en" || lang === "pl" ? lang : project.projectLanguage === "PL" ? "pl" : "en";

  return renderBuildCard({
    project,
    credit,
    team: credits,
    locale,
    host: url.host.replace(/^www\./, ""),
    download: url.searchParams.get("download") === "1",
  });
}
