"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminAuditLogs, profileAvatars, profiles } from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit, isUuid } from "@/lib/security";
import { createNotification } from "@/server/services/notifications";

const MAX_AVATAR_BYTES = 550 * 1024;
const MAX_AVATAR_EDGE = 512;
const MIN_AVATAR_EDGE = 64;
const WEBP_PREFIX = "data:image/webp;base64,";

export type AvatarActionState = { ok?: true; error?: string };

function readWebpDimensions(buffer: Buffer) {
  if (buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8X") {
    const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
    const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
    return { width, height };
  }

  if (chunk === "VP8L") {
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return { width, height };
  }

  if (chunk === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  return null;
}

function validateAvatarDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith(WEBP_PREFIX)) return { error: "Nieprawidłowy format zdjęcia." } as const;
  const base64 = dataUrl.slice(WEBP_PREFIX.length);
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) return { error: "Nieprawidłowe dane zdjęcia." } as const;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return { error: "Nie udało się odczytać zdjęcia." } as const;
  }

  if (bytes.length < 256) return { error: "Plik zdjęcia jest nieprawidłowy." } as const;
  if (bytes.length > MAX_AVATAR_BYTES) return { error: "Zdjęcie po przetworzeniu jest zbyt duże." } as const;

  const dimensions = readWebpDimensions(bytes);
  if (!dimensions) return { error: "Nie udało się zweryfikować zdjęcia WebP." } as const;
  if (dimensions.width < MIN_AVATAR_EDGE || dimensions.height < MIN_AVATAR_EDGE) {
    return { error: "Zdjęcie jest zbyt małe. Wybierz plik o większej rozdzielczości." } as const;
  }
  if (dimensions.width > MAX_AVATAR_EDGE || dimensions.height > MAX_AVATAR_EDGE) {
    return { error: "Zdjęcie przekracza dozwoloną rozdzielczość." } as const;
  }
  if (Math.abs(dimensions.width - dimensions.height) > 2) {
    return { error: "Zdjęcie profilowe musi być kwadratowe." } as const;
  }

  return { base64, byteSize: bytes.length } as const;
}

async function revalidateAvatarUser(userId: string) {
  const row = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  revalidatePath("/profile");
  revalidatePath("/builders");
  revalidatePath(`/builders/${userId}`);
  revalidatePath("/network");
  if (row[0]?.username) revalidatePath(`/u/${row[0].username}`);
}

export async function submitProfileAvatar(input: {
  dataUrl: string;
  confirmsRights: boolean;
  consentsToDisplay: boolean;
}): Promise<AvatarActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:profile:avatar-upload", user.id, 8, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  if (!input.confirmsRights || !input.consentsToDisplay) {
    return { error: "Potwierdź prawo do zdjęcia i zgodę na jego wyświetlanie." };
  }

  const validated = validateAvatarDataUrl(input.dataUrl);
  if ("error" in validated) return { error: validated.error };
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(profileAvatars)
      .set({ status: "REMOVED", imageBase64: null, moderatedAt: now, rejectionReason: "Zastąpione nowym zgłoszeniem." })
      .where(and(eq(profileAvatars.userId, user.id), eq(profileAvatars.status, "PENDING")));

    await tx.insert(profileAvatars).values({
      userId: user.id,
      status: "PENDING",
      mimeType: "image/webp",
      imageBase64: validated.base64,
      byteSize: validated.byteSize,
      consentAt: now,
      uploadedAt: now,
    });
  });

  await logEvent("profile_avatar_uploaded", user.id, { byteSize: validated.byteSize });
  await revalidateAvatarUser(user.id);
  revalidatePath("/admin/avatars");
  return { ok: true };
}

export async function cancelPendingProfileAvatar(): Promise<AvatarActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  await db
    .update(profileAvatars)
    .set({ status: "REMOVED", imageBase64: null, moderatedAt: new Date(), rejectionReason: "Anulowane przez użytkownika." })
    .where(and(eq(profileAvatars.userId, user.id), eq(profileAvatars.status, "PENDING")));

  await revalidateAvatarUser(user.id);
  revalidatePath("/admin/avatars");
  return { ok: true };
}

export async function removeApprovedProfileAvatar(): Promise<AvatarActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:profile:avatar-remove", user.id, 12, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  await db
    .update(profileAvatars)
    .set({ status: "REMOVED", imageBase64: null, moderatedAt: new Date(), rejectionReason: "Usunięte przez użytkownika." })
    .where(and(eq(profileAvatars.userId, user.id), eq(profileAvatars.status, "APPROVED")));

  await logEvent("profile_avatar_removed", user.id);
  await revalidateAvatarUser(user.id);
  return { ok: true };
}

async function requireAdmin() {
  const user = await getVerifiedCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) throw new Error("Brak uprawnień administratora.");
  return user;
}

export async function moderateProfileAvatar(formData: FormData) {
  const admin = await requireAdmin();
  const avatarId = String(formData.get("avatarId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  if (!isUuid(avatarId) || !["approve", "reject"].includes(decision)) return;

  const targetRows = await db
    .select({ id: profileAvatars.id, userId: profileAvatars.userId, status: profileAvatars.status, imageBase64: profileAvatars.imageBase64 })
    .from(profileAvatars)
    .where(eq(profileAvatars.id, avatarId))
    .limit(1);
  const target = targetRows[0];
  if (!target || target.status !== "PENDING" || !target.imageBase64) return;

  const now = new Date();
  if (decision === "approve") {
    const applied = await db.transaction(async (tx) => {
      const changed = await tx
        .update(profileAvatars)
        .set({ status: "APPROVED", moderatedAt: now, moderatedBy: admin.id, rejectionReason: null })
        .where(and(eq(profileAvatars.id, avatarId), eq(profileAvatars.status, "PENDING")))
        .returning({ id: profileAvatars.id });
      if (!changed.length) return false;

      await tx
        .update(profileAvatars)
        .set({ status: "REMOVED", imageBase64: null, moderatedAt: now, moderatedBy: admin.id, rejectionReason: "Zastąpione zaakceptowanym zdjęciem." })
        .where(and(eq(profileAvatars.userId, target.userId), eq(profileAvatars.status, "APPROVED"), ne(profileAvatars.id, avatarId)));
      await tx.insert(adminAuditLogs).values({
        adminId: admin.id,
        action: "PROFILE_AVATAR_APPROVED",
        targetType: "profile_avatar",
        targetId: avatarId,
        details: { userId: target.userId },
      });
      return true;
    });
    if (!applied) return;

    await createNotification(
      target.userId,
      "PROFILE_AVATAR_APPROVED",
      "Zdjęcie profilowe zaakceptowane",
      "Twoje zdjęcie profilowe jest już widoczne w BuildCrew.",
      "/profile",
      { entityType: "profile_avatar", entityId: avatarId, titleEn: "Profile photo approved", bodyEn: "Your profile photo is now visible on BuildCrew." },
    );
  } else {
    const safeReason = reason || "Zdjęcie nie spełnia zasad profilu BuildCrew. Możesz przesłać inne.";
    const applied = await db.transaction(async (tx) => {
      const changed = await tx
        .update(profileAvatars)
        .set({
          status: "REJECTED",
          imageBase64: null,
          moderatedAt: now,
          moderatedBy: admin.id,
          rejectionReason: safeReason,
        })
        .where(and(eq(profileAvatars.id, avatarId), eq(profileAvatars.status, "PENDING")))
        .returning({ id: profileAvatars.id });
      if (!changed.length) return false;

      await tx.insert(adminAuditLogs).values({
        adminId: admin.id,
        action: "PROFILE_AVATAR_REJECTED",
        targetType: "profile_avatar",
        targetId: avatarId,
        details: { userId: target.userId, reason: safeReason },
      });
      return true;
    });
    if (!applied) return;

    await createNotification(
      target.userId,
      "PROFILE_AVATAR_REJECTED",
      "Zdjęcie profilowe wymaga zmiany",
      safeReason,
      "/profile",
      { entityType: "profile_avatar", entityId: avatarId, titleEn: "Your profile photo needs changes", bodyEn: "Your photo did not meet the BuildCrew profile guidelines. You can upload another one." },
    );
  }

  await revalidateAvatarUser(target.userId);
  revalidatePath("/admin");
  revalidatePath("/admin/avatars");
}
