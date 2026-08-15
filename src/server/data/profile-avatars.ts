import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profileAvatars, profiles, users } from "@/db/schema";
import { isUuid } from "@/lib/security";

export async function getProfileAvatarState(userId: string) {
  if (!isUuid(userId)) return { approved: null, pending: null, rejected: null };
  const rows = await db
    .select({
      id: profileAvatars.id,
      status: profileAvatars.status,
      byteSize: profileAvatars.byteSize,
      uploadedAt: profileAvatars.uploadedAt,
      moderatedAt: profileAvatars.moderatedAt,
      rejectionReason: profileAvatars.rejectionReason,
    })
    .from(profileAvatars)
    .where(eq(profileAvatars.userId, userId))
    .orderBy(desc(profileAvatars.uploadedAt))
    .limit(12);

  return {
    approved: rows.find((row) => row.status === "APPROVED") ?? null,
    pending: rows.find((row) => row.status === "PENDING") ?? null,
    rejected: rows.find((row) => row.status === "REJECTED") ?? null,
  };
}

export async function getApprovedAvatarByUsername(username: string) {
  const normalized = username.trim();
  if (!normalized) return null;

  const rows = await db
    .select({
      id: profileAvatars.id,
      userId: profileAvatars.userId,
      mimeType: profileAvatars.mimeType,
      imageBase64: profileAvatars.imageBase64,
      publicProfile: profiles.publicProfile,
      isSuspended: users.isSuspended,
    })
    .from(profileAvatars)
    .innerJoin(profiles, eq(profiles.userId, profileAvatars.userId))
    .innerJoin(users, eq(users.id, profileAvatars.userId))
    .where(
      and(
        eq(profiles.username, normalized),
        eq(profileAvatars.status, "APPROVED"),
        eq(users.isSuspended, false),
      ),
    )
    .orderBy(desc(profileAvatars.moderatedAt), desc(profileAvatars.uploadedAt))
    .limit(1);

  const row = rows[0];
  if (!row?.imageBase64) return null;
  return { ...row, imageBase64: row.imageBase64 };
}

export async function listPendingProfileAvatars(limit = 100) {
  return db
    .select({
      id: profileAvatars.id,
      userId: profileAvatars.userId,
      byteSize: profileAvatars.byteSize,
      uploadedAt: profileAvatars.uploadedAt,
      consentAt: profileAvatars.consentAt,
      username: profiles.username,
      email: users.email,
    })
    .from(profileAvatars)
    .innerJoin(profiles, eq(profiles.userId, profileAvatars.userId))
    .innerJoin(users, eq(users.id, profileAvatars.userId))
    .where(and(eq(profileAvatars.status, "PENDING"), eq(users.isSuspended, false)))
    .orderBy(profileAvatars.uploadedAt)
    .limit(limit);
}

export async function getPendingProfileAvatarForAdmin(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db
    .select({
      id: profileAvatars.id,
      mimeType: profileAvatars.mimeType,
      imageBase64: profileAvatars.imageBase64,
      status: profileAvatars.status,
    })
    .from(profileAvatars)
    .where(eq(profileAvatars.id, id))
    .limit(1);
  const row = rows[0];
  if (!row?.imageBase64 || row.status !== "PENDING") return null;
  return { ...row, imageBase64: row.imageBase64 };
}

export async function getPendingProfileAvatarImageForUser(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await db
    .select({ mimeType: profileAvatars.mimeType, imageBase64: profileAvatars.imageBase64 })
    .from(profileAvatars)
    .where(and(eq(profileAvatars.userId, userId), eq(profileAvatars.status, "PENDING")))
    .orderBy(desc(profileAvatars.uploadedAt))
    .limit(1);
  const row = rows[0];
  if (!row?.imageBase64) return null;
  return { ...row, imageBase64: row.imageBase64 };
}
