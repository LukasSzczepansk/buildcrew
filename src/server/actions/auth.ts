"use server";

import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  adminLoginChallenges,
  emailVerificationTokens,
  passwordResetTokens,
  profiles,
  sessions,
  users,
} from "@/db/schema";
import {
  clearAdminChallengeCookie,
  createSessionForUser,
  destroyAllSessionsForUser,
  destroySession,
  getAdminChallengeCookie,
  getCurrentUser,
  getPostAuthRedirect,
  hashPassword,
  isAdmin,
  setAdminChallengeCookie,
  setPostAuthRedirect,
  consumePostAuthRedirect,
  verifyPassword,
} from "@/lib/auth";
import { absoluteUrl, buildCrewEmail, sendTransactionalEmail } from "@/lib/email";
import { checkRateLimit, getRequestIp, randomSixDigitCode, randomToken, sha256 } from "@/lib/security";
import { safeInternalRedirect } from "@/lib/redirects";
import { getRequestLocale, getRequestOrigin } from "@/lib/site-server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations";

export type AuthFormState = {
  error?: string;
  success?: string;
};

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const ADMIN_MFA_TTL_MS = 10 * 60 * 1000;
const DUMMY_HASH = "$2b$12$QHkb9WnQZMGgHk73v/R9LuX7obv1s5O3jLCu2MGGvHqTu9m.GVIbS";

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

async function issueVerificationEmail(userId: string, email: string, nextPath?: string) {
  const [locale, baseUrl] = await Promise.all([getRequestLocale(), getRequestOrigin()]);
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
  const verifyPath = `/verify-email?token=${encodeURIComponent(token)}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`;
  const link = absoluteUrl(verifyPath, baseUrl);
  return sendTransactionalEmail({
    to: email,
    subject: locale === "en" ? "Confirm your BuildCrew email" : "Verify your email on BuildCrew",
    html: buildCrewEmail({
      locale,
      baseUrl,
      eyebrow: locale === "en" ? "Account security" : "Account security",
      title: locale === "en" ? "Confirm your email" : "Verify your email",
      intro: locale === "en" ? "Confirm your address to start using BuildCrew." : "Verify your email address to use BuildCrew.",
      ctaLabel: locale === "en" ? "Confirm email" : "Verify email",
      ctaHref: verifyPath,
      footer: locale === "en"
        ? "This link expires in 24 hours. If you did not create this account, you can ignore this message."
        : "The link expires after 24 hours. If you did not create this account, you can ignore this email.",
    }),
    devPreview: `Verification link: ${link}`,
  });
}

async function issuePasswordResetEmail(userId: string, email: string) {
  const [locale, baseUrl] = await Promise.all([getRequestLocale(), getRequestOrigin()]);
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
  const link = absoluteUrl(resetPath, baseUrl);
  return sendTransactionalEmail({
    to: email,
    subject: locale === "en" ? "Reset your BuildCrew password" : "BuildCrew password reset",
    html: buildCrewEmail({
      locale,
      baseUrl,
      eyebrow: locale === "en" ? "Account security" : "Account security",
      title: locale === "en" ? "Set a new password" : "Set a new password",
      intro: locale === "en" ? "We received a request to change the password for your account." : "We received a request to change your account password.",
      ctaLabel: locale === "en" ? "Set new password" : "Set a new password",
      ctaHref: resetPath,
      footer: locale === "en"
        ? "This link expires in 30 minutes. If you did not request a password reset, ignore this message."
        : "The link expires after 30 minutes. If you did not request this, you can ignore this email.",
    }),
    devPreview: `${locale === "en" ? "Password reset link" : "Password reset link"}: ${link}`,
  });
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = await getRequestLocale();
  const rawNext = String(formData.get("next") ?? "").trim();
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "") : "";
  const ip = await getRequestIp();
  const limit = await checkRateLimit("auth:signup:ip", `ip:${ip}`, 5, 60 * 60);
  if (!limit.allowed) return { error: "Too many sign-up attempts. Please try again later." };

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };

  const email = parsed.data.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { error: "An account with this email address already exists." };

  const passwordHash = await hashPassword(parsed.data.password);
  let inserted: { id: string }[];
  try {
    const acceptedAt = new Date();
    inserted = await db.insert(users).values({
      email,
      preferredLocale: locale,
      passwordHash,
      termsAcceptedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt,
    }).returning({ id: users.id });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "An account with this email address already exists." };
    throw error;
  }
  const user = inserted[0];
  if (!user) return { error: "We could not create your account." };
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
  await createSessionForUser(user.id);
  if (nextPath) await setPostAuthRedirect(nextPath);
  await issueVerificationEmail(user.id, email, nextPath || undefined);
  redirect("/verify-email?sent=1");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = await getRequestLocale();
  const rawNext = String(formData.get("next") ?? "").trim();
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "") : "";
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };

  const email = parsed.data.email.toLowerCase();
  const ip = await getRequestIp();
  const [ipLimit, comboLimit] = await Promise.all([
    checkRateLimit("auth:login:ip", `ip:${ip}`, 30, 15 * 60),
    checkRateLimit("auth:login:combo", `ip:${ip}|email:${email}`, 8, 15 * 60),
  ]);
  if (!ipLimit.allowed || !comboLimit.allowed) {
    return { error: "Too many login attempts. Please try again in a few minutes." };
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: "Incorrect email or password." };
  if (user.isSuspended) return { error: "This account has been suspended." };

  if (!user.emailVerifiedAt) {
    await db.update(users).set({ lastActiveAt: new Date(), preferredLocale: locale }).where(eq(users.id, user.id));
    await createSessionForUser(user.id);
    if (nextPath) await setPostAuthRedirect(nextPath);
    redirect("/verify-email");
  }

  if (isAdmin(user.email, user.systemRole)) {
    const code = randomSixDigitCode();
    const expiresAt = new Date(Date.now() + ADMIN_MFA_TTL_MS);
    await db.delete(adminLoginChallenges).where(eq(adminLoginChallenges.userId, user.id));
    const [challenge] = await db
      .insert(adminLoginChallenges)
      .values({ userId: user.id, codeHash: await hashPassword(code), expiresAt })
      .returning({ id: adminLoginChallenges.id });
    await setAdminChallengeCookie(challenge.id, expiresAt);
    const sent = await sendTransactionalEmail({
      to: user.email,
      subject: "Kod logowania administratora BuildCrew",
      html: buildCrewEmail({ eyebrow: "Logowanie administratora", title: "Kod logowania", content: `<div style="font-size:30px;font-weight:700;letter-spacing:6px;margin:18px 0">${code}</div><p style="font-size:12px;line-height:1.6;color:#777770;margin:0">Kod wygasa po 10 minutach.</p>`, footer: "If you did not try to sign in, change your password and review active sessions." }),
      devPreview: `Kod administratora: ${code}`,
    });
    if (!sent.ok && process.env.NODE_ENV === "production") {
      await db.delete(adminLoginChallenges).where(eq(adminLoginChallenges.id, challenge.id));
      await clearAdminChallengeCookie();
      return { error: "Administrator login requires email delivery to be configured." };
    }
    redirect("/admin-verify");
  }

  const loginAt = new Date();
  await db.update(users).set({ lastLoginAt: loginAt, lastActiveAt: loginAt, preferredLocale: locale }).where(eq(users.id, user.id));
  await createSessionForUser(user.id);

  const profileRows = await db
    .select({ onboardingCompleted: profiles.onboardingCompleted })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (profileRows[0]?.onboardingCompleted) redirect(nextPath || "/dashboard");
  if (nextPath) await setPostAuthRedirect(nextPath);
  redirect("/onboarding");
}

export async function adminVerifyAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const challengeId = await getAdminChallengeCookie();
  if (!challengeId) return { error: "The verification session expired. Please log in again." };
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Wpisz 6-cyfrowy kod." };

  const ip = await getRequestIp();
  const limit = await checkRateLimit("auth:admin-mfa", `ip:${ip}|challenge:${challengeId}`, 8, 10 * 60);
  if (!limit.allowed) return { error: "Too many attempts. Please log in again." };

  const rows = await db
    .select({ challenge: adminLoginChallenges, user: users })
    .from(adminLoginChallenges)
    .innerJoin(users, eq(users.id, adminLoginChallenges.userId))
    .where(and(eq(adminLoginChallenges.id, challengeId), gt(adminLoginChallenges.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || row.challenge.attempts >= 5) {
    await clearAdminChallengeCookie();
    return { error: "The code expired. Please log in again." };
  }
  if (!isAdmin(row.user.email, row.user.systemRole) || !(await verifyPassword(code, row.challenge.codeHash))) {
    await db
      .update(adminLoginChallenges)
      .set({ attempts: row.challenge.attempts + 1 })
      .where(eq(adminLoginChallenges.id, challengeId));
    return { error: "Invalid code." };
  }

  await db.delete(adminLoginChallenges).where(eq(adminLoginChallenges.id, challengeId));
  await clearAdminChallengeCookie();
  const adminLoginAt = new Date();
  await db.update(users).set({ lastLoginAt: adminLoginAt, lastActiveAt: adminLoginAt }).where(eq(users.id, row.user.id));
  await createSessionForUser(row.user.id);
  redirect("/admin");
}

export async function resendVerificationAction(): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  if (user.emailVerified) return { success: "Your email is already verified." };
  const limit = await checkRateLimit("auth:verify:resend", `user:${user.id}`, 5, 60 * 60);
  if (!limit.allowed) return { error: "Too many email requests. Please try again later." };
  const pendingNext = await getPostAuthRedirect("");
  const sent = await issueVerificationEmail(user.id, user.email, pendingNext || undefined);
  return sent.ok ? { success: "We sent a new verification link." } : { error: "We could not send the email." };
}

export async function verifyEmailAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const rawNext = String(formData.get("next") ?? "").trim();
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "") : "";
  const token = String(formData.get("token") ?? "");
  if (token.length < 20) return { error: "Invalid verification link." };
  const tokenHash = sha256(token);
  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), gt(emailVerificationTokens.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return { error: "This link is invalid or has expired." };
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  const current = await getCurrentUser();
  if (!current || current.id !== row.userId) redirect(nextPath ? `/login?verified=1&next=${encodeURIComponent(nextPath)}` : "/login?verified=1");
  if (!current.onboardingCompleted) {
    if (nextPath) await setPostAuthRedirect(nextPath);
    redirect("/onboarding");
  }
  if (nextPath) redirect(nextPath);
  redirect(await consumePostAuthRedirect("/dashboard"));
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Podaj poprawny e-mail." };
  const email = parsed.data.email.toLowerCase();
  const ip = await getRequestIp();
  const limit = await checkRateLimit("auth:forgot", `ip:${ip}|email:${email}`, 5, 60 * 60);
  if (!limit.allowed) return { success: "If the account exists, we sent a password reset link." };
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  if (rows[0]) await issuePasswordResetEmail(rows[0].id, rows[0].email);
  return { success: "If the account exists, we sent a password reset link." };
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getRequestIp();
  const resetLimit = await checkRateLimit("auth:reset", `ip:${ip}`, 20, 60 * 60);
  if (!resetLimit.allowed) return { error: "Too many attempts. Please try again later." };
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the provided data." };

  const tokenHash = sha256(parsed.data.token);
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return { error: "The password reset link is invalid or has expired." };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, row.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
  await db.delete(sessions).where(eq(sessions.userId, row.userId));
  redirect("/login?reset=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function logoutEverywhereAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await destroyAllSessionsForUser(user.id);
  redirect("/login?all=1");
}
