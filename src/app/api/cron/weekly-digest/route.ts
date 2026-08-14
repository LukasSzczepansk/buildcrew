import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { sendWeeklyDigests } from "@/server/services/retention-emails";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const result = await sendWeeklyDigests();
  return NextResponse.json({ ok: true, ...result });
}
