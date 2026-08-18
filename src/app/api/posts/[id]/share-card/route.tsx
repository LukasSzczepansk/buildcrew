import { ImageResponse } from "next/og";
import { getSocialPostById } from "@/server/data/social-posts";
import { labelsFor } from "@/lib/constants-i18n";
import { socialPostKindLabel, socialPostTitle } from "@/lib/social-posts";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getSocialPostById(id);
  if (!post) return new Response("Not found", { status: 404 });
  const locale = "pl" as const;
  const labels = labelsFor(locale);
  const title = socialPostTitle(post, locale);
  const label = socialPostKindLabel(post.kind, locale).toUpperCase();
  const role = post.role ? labels.roles[post.role] : "Builder";
  const host = new URL(request.url).host.replace(/^www\./, "");
  const projectPost = Boolean(post.projectId && ["UPDATE", "LOOKING_FOR_PEOPLE", "MILESTONE", "LAUNCH"].includes(post.kind));

  return new ImageResponse(
    <div style={{ width: "1200px", height: "630px", display: "flex", background: "#F4F4EF", color: "#111", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "850px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 60px", borderRight: "1px solid #DADAD3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "26px", fontWeight: 700 }}><div style={{ width: "7px", height: "34px", background: "#C8F169", borderRadius: "2px" }} />BuildCrew</div>
          <div style={{ fontSize: "14px", letterSpacing: "1.2px", color: "#777", fontWeight: 700 }}>{label}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 34 ? "50px" : "60px", fontWeight: 700, lineHeight: 1.03, letterSpacing: "-2px", maxWidth: "730px" }}>{title}</div>
          <div style={{ marginTop: "24px", fontSize: "25px", lineHeight: 1.4, color: "#5F5F5A", maxWidth: "720px" }}>{truncate(post.body, 220)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", borderTop: "1px solid #DADAD3" }}><div style={{ fontSize: "17px", color: "#555" }}>@{post.username} · {role}</div><div style={{ fontSize: "16px", fontWeight: 600 }}>{host}</div></div>
      </div>
      <div style={{ width: "350px", background: "#111", color: "#F4F4EF", padding: "56px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: "13px", letterSpacing: "1.2px", color: "#AAA" }}>BUILD TOGETHER</div><div style={{ width: "44px", height: "6px", background: "#C8F169", borderRadius: "3px", marginTop: "22px" }} /><div style={{ fontSize: "34px", fontWeight: 650, lineHeight: 1.18, marginTop: "32px" }}>{projectPost ? "Zobacz projekt i ludzi, którzy go budują." : "Poznaj profil i sprawdź możliwość współpracy."}</div></div>
        <div style={{ fontSize: "20px", lineHeight: 1.4, color: "#C8C8C2" }}>Ludzie · Projekty · Współpraca</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" } },
  );
}

function truncate(value: string, max: number) { return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`; }
