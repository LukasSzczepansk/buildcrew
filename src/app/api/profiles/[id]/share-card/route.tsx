import { ImageResponse } from "next/og";
import { getProfileByUserId } from "@/server/data/profiles";
import { labelsFor } from "@/lib/constants-i18n";
import { locationLabel } from "@/lib/countries";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfileByUserId(id);
  if (!profile || !profile.publicProfile) return new Response("Not found", { status: 404 });
  const labels = labelsFor("pl");
  const role = profile.role ? labels.roles[profile.role] : "Builder";
  const location = locationLabel(profile.city, profile.country);
  const host = new URL(request.url).host.replace(/^www\./, "");
  return new ImageResponse(
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#F4F4EF", color: "#111", fontFamily: "Arial, sans-serif" }}>
      <div style={{ flex: 1, padding: "58px 62px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "26px", fontWeight: 700 }}><div style={{ width: "7px", height: "34px", background: "#C8F169", borderRadius: "2px" }} />BuildCrew</div>
        <div>
          <div style={{ fontSize: "68px", fontWeight: 700, letterSpacing: "-2.4px", lineHeight: 1 }}>@{profile.username}</div>
          <div style={{ marginTop: "18px", fontSize: "30px", color: "#555" }}>{profile.headline || role}</div>
          {location ? <div style={{ marginTop: "13px", fontSize: "21px", color: "#777" }}>{location}</div> : null}
          {profile.skills.length ? <div style={{ marginTop: "30px", fontSize: "20px", color: "#333" }}>{profile.skills.slice(0, 6).join("  ·  ")}</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #DADAD3", paddingTop: "20px", fontSize: "16px" }}><span>{role}</span><span style={{ fontWeight: 600 }}>{host}</span></div>
      </div>
      <div style={{ width: "340px", background: "#111", color: "#F4F4EF", padding: "58px 42px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><div style={{ fontSize: "13px", color: "#AAA", letterSpacing: "1.2px" }}>BUILDER PROFILE</div><div style={{ width: "44px", height: "6px", background: "#C8F169", marginTop: "22px", borderRadius: "3px" }} /><div style={{ marginTop: "32px", fontSize: "34px", lineHeight: 1.18, fontWeight: 650 }}>Zobacz, co buduję i na jakie współprace jestem otwarty.</div></div><div style={{ fontSize: "19px", color: "#C8C8C2", lineHeight: 1.45 }}>Ludzie · Projekty · Współpraca</div></div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
