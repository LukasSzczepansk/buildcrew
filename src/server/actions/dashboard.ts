"use server";

import { db } from "@/db";
import { dashboardVisitState } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";

export async function markDashboardVisited() {
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  const now = new Date();
  await db.insert(dashboardVisitState)
    .values({ userId: user.id, lastVisitedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: dashboardVisitState.userId,
      set: { lastVisitedAt: now, updatedAt: now },
    });
}
