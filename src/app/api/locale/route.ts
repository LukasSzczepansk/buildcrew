import { NextResponse } from "next/server";

/**
 * Legacy endpoint kept so older clients do not fail. BuildCrew is English-only,
 * so locale changes are intentionally ignored.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true, locale: "en" });
  response.cookies.set("buildcrew-locale", "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
