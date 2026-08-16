import { ImageResponse } from "next/og";
import { getProjectById } from "@/server/data/projects";
import { labelsFor } from "@/lib/constants-i18n";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project || project.projectLanguage !== "EN") return new Response("Not found", { status: 404 });

  const requestUrl = new URL(request.url);
  const labels = labelsFor("en");
  const variant = requestUrl.searchParams.get("variant");
  const roleId = requestUrl.searchParams.get("role");
  const requestedRole = variant === "recruitment"
    ? project.openRoles.find((item) => item.id === roleId) ?? project.openRoles[0]
    : undefined;

  const technologies = (requestedRole?.skills.length ? requestedRole.skills : project.technologies).slice(0, 5);
  const openRoleLabels = project.openRoles.slice(0, 3).map((role) => labels.roles[role.roleType]);
  const crewSize = Math.max(project.members.length, project.owner ? 1 : 0);
  const totalSlots = project.roles.reduce((sum, role) => sum + role.slots, 0) + 1;
  const stage = stripStageEmoji(labels.stages[project.stage]);
  const commitment = project.commitment ? labels.commitments[project.commitment] : "Flexible";
  const host = requestUrl.host.replace(/^www\./, "");
  const isRecruitment = Boolean(requestedRole);
  const projectNameSize = project.name.length > 42 ? 52 : project.name.length > 28 ? 58 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#F4F4EF",
          color: "#111111",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "820px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 56px 50px",
            borderRight: "1px solid #DADAD3",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
              <div style={{ width: "7px", height: "34px", background: "#C8F169", borderRadius: "2px" }} />
              <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.6px" }}>BuildCrew</div>
            </div>
            <div style={{ fontSize: "15px", color: "#70706B", letterSpacing: "0.9px", textTransform: "uppercase" }}>
              {isRecruitment ? "Open role" : "Project"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: "700px" }}>
            {isRecruitment ? (
              <>
                <div style={{ fontSize: "23px", color: "#70706B", marginBottom: "12px" }}>{project.name}</div>
                <div style={{ fontSize: "65px", lineHeight: 1.02, fontWeight: 700, letterSpacing: "-2.2px" }}>
                  Looking for {labels.roles[requestedRole!.roleType]}
                </div>
              </>
            ) : (
              <div style={{ fontSize: `${projectNameSize}px`, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-2.2px" }}>
                {project.name}
              </div>
            )}

            <div style={{ marginTop: "22px", maxWidth: "680px", fontSize: "25px", lineHeight: 1.35, color: "#5F5F5A" }}>
              {project.tagline}
            </div>

            {technologies.length > 0 ? (
              <div style={{ display: "flex", marginTop: "27px", fontSize: "18px", lineHeight: 1.4, color: "#252525" }}>
                {technologies.join("  ·  ")}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #DADAD3", paddingTop: "20px" }}>
            <div style={{ display: "flex", gap: "34px" }}>
              <Metric label="Stage" value={stage} />
              <Metric label="Time" value={commitment} />
              <Metric label="Team" value={`${crewSize}/${Math.max(totalSlots, crewSize)}`} />
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>{host}</div>
          </div>
        </div>

        <div
          style={{
            width: "380px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 44px 50px",
            background: "#111111",
            color: "#F4F4EF",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "13px", color: "#A5A59F", letterSpacing: "1.2px", textTransform: "uppercase" }}>
              {isRecruitment ? "Join the project" : "We are looking for"}
            </div>

            <div style={{ marginTop: "22px", width: "42px", height: "5px", borderRadius: "2px", background: "#C8F169" }} />

            <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {isRecruitment ? (
                <>
                  <div style={{ fontSize: "33px", lineHeight: 1.15, fontWeight: 600 }}>{labels.roles[requestedRole!.roleType]}</div>
                  {requestedRole!.description ? (
                    <div style={{ fontSize: "18px", lineHeight: 1.45, color: "#C8C8C2" }}>
                      {truncate(requestedRole!.description, 120)}
                    </div>
                  ) : (
                    <div style={{ fontSize: "18px", lineHeight: 1.45, color: "#C8C8C2" }}>
                      An open role on the team. Check the scope and contact the project owner.
                    </div>
                  )}
                </>
              ) : openRoleLabels.length > 0 ? (
                openRoleLabels.map((role) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "24px", lineHeight: 1.3 }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#C8F169" }} />
                    {role}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "25px", lineHeight: 1.3, fontWeight: 600 }}>The team is currently complete.</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "18px", lineHeight: 1.45, color: "#C8C8C2" }}>
              {isRecruitment ? "See the project, team and role details." : "See the project and meet the people building it."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "19px", fontWeight: 600 }}>
              <div style={{ width: "16px", height: "4px", borderRadius: "2px", background: "#C8F169" }} />
              Open on BuildCrew
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ fontSize: "12px", color: "#9A9A94", letterSpacing: "0.7px", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "17px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function stripStageEmoji(value: string) {
  const parts = value.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : value;
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
