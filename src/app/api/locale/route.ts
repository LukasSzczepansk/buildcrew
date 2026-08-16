import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type AppLocaleDb } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { locale?: string } | null;
  const locale: AppLocaleDb | null = payload?.locale === "en" || payload?.locale === "pl" ? payload.locale : null;
  if (!locale) return NextResponse.json({ error: "Invalid locale" }, { status: 400 });

  const user = await getCurrentUser();
  if (user) await db.update(users).set({ preferredLocale: locale }).where(eq(users.id, user.id));

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set("buildcrew-locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}
