import "server-only";
import { db } from "@/db";
import { analyticsEvents, type AnalyticsEventType } from "@/db/schema";

export async function logEvent(
  eventType: AnalyticsEventType,
  userId?: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.insert(analyticsEvents).values({
      eventType,
      userId: userId ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("analytics log failed", err);
  }
}
