import { ImageResponse } from "next/og";

export const alt = "BuildCrew — znajdź ludzi i zbudujcie projekt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F4F4EF",
          color: "#111111",
          padding: "64px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "28px", fontWeight: 700 }}>
          <div style={{ width: "7px", height: "32px", background: "#C8F169" }} />
          BuildCrew
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "930px" }}>
          <div style={{ fontSize: "70px", lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 700 }}>
            Znajdź ludzi. Zróbcie projekt.
          </div>
          <div style={{ marginTop: "26px", fontSize: "26px", lineHeight: 1.4, color: "#5F5F5A" }}>
            Projekty do portfolio, side-projecty i ludzie do wspólnego budowania.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #CFCFC7", paddingTop: "22px", fontSize: "20px", color: "#6F6F69" }}>
          <span>Programowanie · Design · Product</span>
          <span>buildcreww.pl</span>
        </div>
      </div>
    ),
    size,
  );
}
