import { NextResponse } from "next/server";
import { pool } from "@/db";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const expired = await pool.query(
    `update profile_avatars
       set status = 'REMOVED', image_base64 = null, moderated_at = now(),
           rejection_reason = 'Zgłoszenie wygasło po 30 dniach bez decyzji.'
     where status = 'PENDING' and uploaded_at < now() - interval '30 days'`,
  );
  const cleaned = await pool.query(
    `delete from profile_avatars
     where status in ('REJECTED', 'REMOVED')
       and coalesce(moderated_at, uploaded_at) < now() - interval '12 months'`,
  );

  return NextResponse.json({ ok: true, expiredPending: expired.rowCount ?? 0, deletedMetadata: cleaned.rowCount ?? 0 });
}
