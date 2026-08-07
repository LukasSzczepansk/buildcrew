import "server-only";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { isUuid } from "@/lib/security";
import { blocks } from "@/db/schema";

export async function isBlockedEitherWay(userA: string, userB: string) {
  if (!isUuid(userA) || !isUuid(userB)) return false;
  const rows = await db
    .select()
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, userA), eq(blocks.blockedId, userB)),
        and(eq(blocks.blockerId, userB), eq(blocks.blockedId, userA)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
