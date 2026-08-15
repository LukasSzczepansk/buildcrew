import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { dashboardVisitState, notifications } from "@/db/schema";

export async function getDashboardSinceLastVisit(userId: string, limit = 6) {
  const stateRows = await db
    .select({ lastVisitedAt: dashboardVisitState.lastVisitedAt })
    .from(dashboardVisitState)
    .where(eq(dashboardVisitState.userId, userId))
    .limit(1);
  const lastVisitedAt = stateRows[0]?.lastVisitedAt ?? null;
  if (!lastVisitedAt) return { lastVisitedAt: null, count: 0, items: [] };

  const [countRows, items] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), gt(notifications.createdAt, lastVisitedAt))),
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), gt(notifications.createdAt, lastVisitedAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
  ]);

  return {
    lastVisitedAt,
    count: Number(countRows[0]?.count ?? 0),
    items,
  };
}
