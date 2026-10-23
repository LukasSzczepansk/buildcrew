import { ImageResponse } from "next/og";
import { labelsFor } from "@/lib/constants-i18n";
import type { RoleType } from "@/db/schema";

const INK = "#1C1B17";
const PAPER = "#F5F3EC";
const LIME = "#C8F169";

export type BuildCardData = {
  project: { name: string; tagline: string; technologies: string[]; createdAt: Date; completedAt: Date | null; updatedAt: Date };
  credit: { id: string; usernameSnapshot: string; roleType: RoleType | null; isOwner: boolean };
  team: { id: string; usernameSnapshot: string }[];
  locale: "pl" | "en";
  host: string;
  download: boolean;
};

/** Renders the 1200x627 (LinkedIn ratio) "Build card" image for one contributor of a completed project. */
export function renderBuildCard({ project, credit, team: credits, locale, host, download }: BuildCardData) {
  const en = locale === "en";
  const labels = labelsFor(locale);
  const start = project.createdAt;
  const end = project.completedAt ?? project.updatedAt;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const weeks = Math.max(1, Math.round(days / 7));
  const durationValue = days < 14 ? days : weeks;
  const durationLabel = days < 14
    ? (en ? (days === 1 ? "day of building" : "days of building") : days === 1 ? "dzień budowania" : "dni budowania")
    : (en ? (weeks === 1 ? "week of building" : "weeks of building") : weeks === 1 ? "tydzień budowania" : weeks < 5 ? "tygodnie budowania" : "tygodni budowania");
  const dateFormat = new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", { month: "short", year: "numeric" });
  const range = `${dateFormat.format(start)} - ${dateFormat.format(end)}`;

  const roleLabel = credit.isOwner
    ? credit.roleType ? `${en ? "Owner" : "Autor"} · ${labels.roles[credit.roleType]}` : en ? "Project owner" : "Autor projektu"
    : credit.roleType ? labels.roles[credit.roleType] : en ? "Collaborator" : "Współtwórca";

  const team = credits.slice(0, 6);
  const extra = Math.max(0, credits.length - team.length);
  const tech = project.technologies.slice(0, 5);
  const nameSize = project.name.length > 34 ? 52 : project.name.length > 22 ? 62 : 72;
  const headers: Record<string, string> = { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" };
  if (download) {
    const safe = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
    headers["Content-Disposition"] = `attachment; filename="buildcrew-${safe}-card.png"`;
  }

  return new ImageResponse(
    (
      <div style={{ width: "1200px", height: "627px", display: "flex", background: PAPER, color: INK, fontFamily: "Arial, sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", left: "-140px", top: "-160px", width: "520px", height: "520px", borderRadius: "260px", background: "radial-gradient(circle, rgba(200,241,105,0.55), rgba(200,241,105,0))", display: "flex" }} />

        <div style={{ width: "830px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 56px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "8px", height: "32px", background: LIME, borderRadius: "4px", display: "flex" }} />
            <div style={{ display: "flex", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px" }}>BuildCrew</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignSelf: "flex-start", padding: "7px 16px", borderRadius: "999px", background: INK, color: LIME, fontSize: "15px", fontWeight: 700, letterSpacing: "1.4px" }}>
              {en ? "COMPLETED PROJECT" : "UKOŃCZONY PROJEKT"}
            </div>
            <div style={{ display: "flex", marginTop: "22px", fontSize: `${nameSize}px`, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-2.5px", maxWidth: "720px" }}>{project.name}</div>
            <div style={{ display: "flex", marginTop: "18px", fontSize: "24px", lineHeight: 1.35, color: "#5F5D54", maxWidth: "700px" }}>{truncate(project.tagline, 110)}</div>
            {tech.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: "22px" }}>
                {tech.map((item) => (
                  <div key={item} style={{ display: "flex", marginRight: "10px", marginBottom: "8px", padding: "6px 14px", borderRadius: "999px", border: "1.5px solid #D6D1C0", background: "#FFFDF8", fontSize: "17px", fontWeight: 600, color: "#3D3B33" }}>{item}</div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", marginRight: "28px" }}>
                <div style={{ display: "flex", fontSize: "13px", letterSpacing: "1.4px", color: "#85837A", fontWeight: 700 }}>{en ? "BUILT BY" : "ZBUDOWAŁ(A)"}</div>
                <div style={{ display: "flex", marginTop: "4px", fontSize: "30px", fontWeight: 700, letterSpacing: "-0.8px" }}>@{credit.usernameSnapshot}</div>
              </div>
              <div style={{ display: "flex", padding: "10px 18px", borderRadius: "14px", background: LIME, fontSize: "20px", fontWeight: 700 }}>{roleLabel}</div>
            </div>
          </div>
        </div>

        <div style={{ width: "370px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 44px", background: INK, color: PAPER }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: "14px", letterSpacing: "1.6px", color: "#A9A79C", fontWeight: 700 }}>BUILD CARD</div>
            <div style={{ display: "flex", width: "44px", height: "6px", background: LIME, borderRadius: "3px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: "92px", fontWeight: 700, letterSpacing: "-4px", lineHeight: 1, color: LIME }}>{durationValue}</div>
            <div style={{ display: "flex", marginTop: "4px", fontSize: "20px", color: "#D8D5C8" }}>{durationLabel}</div>
            <div style={{ display: "flex", marginTop: "6px", fontSize: "16px", color: "#8F8D82" }}>{range}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: "13px", letterSpacing: "1.4px", color: "#A9A79C", fontWeight: 700 }}>{en ? `TEAM · ${credits.length}` : `ZESPÓŁ · ${credits.length}`}</div>
            <div style={{ display: "flex", marginTop: "12px" }}>
              {team.map((member, index) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "22px", marginLeft: index === 0 ? "0" : "-10px", background: member.id === credit.id ? LIME : "#EEF6D3", color: INK, border: `3px solid ${INK}`, fontSize: "15px", fontWeight: 700 }}>
                  {initials(member.usernameSnapshot)}
                </div>
              ))}
              {extra > 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "22px", marginLeft: "-10px", background: "#34332C", color: PAPER, border: `3px solid ${INK}`, fontSize: "14px", fontWeight: 700 }}>+{extra}</div>
              ) : null}
            </div>
            <div style={{ display: "flex", marginTop: "22px", fontSize: "15px", color: "#8F8D82" }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 627, headers },
  );
}


function initials(name: string) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return letters.toUpperCase();
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}
