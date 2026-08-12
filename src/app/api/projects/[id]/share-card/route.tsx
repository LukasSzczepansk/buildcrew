import { ImageResponse } from "next/og";
import { getProjectById } from "@/server/data/projects";
import { ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return new Response("Not found", { status: 404 });

  const roles = project.openRoles.slice(0, 3).map((role) => ROLE_LABELS[role.roleType]);
  const technologies = project.technologies.slice(0, 5);
  const crewSize = Math.max(project.members.length, project.owner ? 1 : 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #f5f3ff 0%, #ffffff 48%, #eef2ff 100%)",
          color: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "30px", fontWeight: 800 }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#7c3aed", color: "white", fontSize: "28px" }}>🛠️</div>
            BuildCrew
          </div>
          <div style={{ padding: "10px 18px", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9", fontSize: "20px", fontWeight: 700 }}>{STAGE_LABELS[project.stage]}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "980px" }}>
          <div style={{ fontSize: "62px", lineHeight: 1.04, fontWeight: 850, letterSpacing: "-2px" }}>{project.name}</div>
          <div style={{ marginTop: "20px", fontSize: "29px", lineHeight: 1.35, color: "#525252" }}>{project.tagline}</div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "30px" }}>
            {technologies.map((technology) => (
              <div key={technology} style={{ border: "2px solid #e5e5e5", borderRadius: "999px", padding: "8px 15px", fontSize: "19px", background: "white" }}>{technology}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "22px", color: "#404040" }}>
            <div style={{ padding: "10px 16px", borderRadius: "12px", background: "white", border: "2px solid #e5e5e5" }}>👥 Ekipa: {crewSize}</div>
            <div style={{ padding: "10px 16px", borderRadius: "12px", background: "#f5f3ff", color: "#6d28d9", fontWeight: 700 }}>{roles.length ? `Szukamy: ${roles.join(" · ")}` : "Ekipa kompletna"}</div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 750, color: "#7c3aed" }}>buildcreww.pl</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
