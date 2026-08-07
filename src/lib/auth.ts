import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions, users, type SystemRole } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/security";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_session" : "buildcrew_session";
const ADMIN_CHALLENGE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_admin_challenge" : "buildcrew_admin_challenge";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null | undefined) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function createSessionForUser(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);

  await db.insert(sessions).values({ userId, expiresAt, tokenHash });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawToken) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(rawToken)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function setAdminChallengeCookie(challengeId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminChallengeCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_CHALLENGE_COOKIE)?.value ?? null;
}

export async function clearAdminChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_CHALLENGE_COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  username: string | null;
  onboardingCompleted: boolean;
  avatarEmoji: string;
  isSuspended: boolean;
  emailVerified: boolean;
  systemRole: SystemRole;
  hasPassword: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  const tokenHash = sha256(rawToken);

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      systemRole: users.systemRole,
      emailVerifiedAt: users.emailVerifiedAt,
      passwordHash: users.passwordHash,
      expiresAt: sessions.expiresAt,
      username: profiles.username,
      onboardingCompleted: profiles.onboardingCompleted,
      avatarEmoji: profiles.avatarEmoji,
      isSuspended: users.isSuspended,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    // getCurrentUser() is also called while rendering Server Components.
    // Next.js does not allow mutating cookies during render, so this helper
    // must stay read-only. A stale cookie will be overwritten on the next
    // successful login or removed by an explicit logout action.
    return null;
  }
  if (row.expiresAt.getTime() < Date.now() || row.isSuspended) {
    // Do not delete the cookie/session from a Server Component render.
    // Expired sessions are removed by db:maintenance; suspended users are
    // treated as logged out immediately because we return null here.
    return null;
  }

  return {
    id: row.userId,
    email: row.email,
    username: row.username,
    onboardingCompleted: row.onboardingCompleted ?? false,
    avatarEmoji: row.avatarEmoji ?? "🙂",
    isSuspended: row.isSuspended,
    emailVerified: Boolean(row.emailVerifiedAt),
    systemRole: row.systemRole,
    hasPassword: Boolean(row.passwordHash),
  };
}

export async function getVerifiedCurrentUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.emailVerified ? user : null;
}

export function isAdmin(email: string | null | undefined, systemRole?: SystemRole | null) {
  if (systemRole === "ADMIN") return true;
  if (!email) return false;
  // Bootstrap fallback only. In production it is disabled unless explicitly enabled for a one-off migration.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_EMAIL_BOOTSTRAP !== "true") return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export function isModerator(systemRole?: SystemRole | null) {
  return systemRole === "ADMIN" || systemRole === "MODERATOR";
}

export async function cleanupExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function userHasValidSession(userId: string) {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
