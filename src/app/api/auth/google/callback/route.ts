import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminLoginChallenges, authAccounts, profiles, users } from "@/db/schema";
import { createSessionForUser, hashPassword, isAdmin, setAdminChallengeCookie, setPostAuthRedirect } from "@/lib/auth";
import { absoluteUrl, buildCrewEmail, sendTransactionalEmail } from "@/lib/email";
import { consumeGoogleOAuthContext, exchangeGoogleCode, fetchGoogleUserInfo } from "@/lib/google-oauth";
import { randomSixDigitCode } from "@/lib/security";
import { withNext } from "@/lib/redirects";
import { getRequestLocale } from "@/lib/site-server";

const ADMIN_MFA_TTL_MS = 10 * 60 * 1000;

function authRedirect(path: string, origin: string) {
  return NextResponse.redirect(absoluteUrl(path, origin));
}

export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const context = await consumeGoogleOAuthContext(state);
  const fallback = context?.intent === "signup" ? "/signup" : "/login";
  const locale = await getRequestLocale();

  if (oauthError) return authRedirect(withNext(`${fallback}?google=access-denied`, context?.nextPath), request.nextUrl.origin);
  if (!context || !code) return authRedirect(`${fallback}?google=state`, request.nextUrl.origin);

  try {
    const accessToken = await exchangeGoogleCode(code, context.verifier, request.nextUrl.origin);
    if (!accessToken) return authRedirect(withNext(`${fallback}?google=failed`, context.nextPath), request.nextUrl.origin);

    const googleUser = await fetchGoogleUserInfo(accessToken);
    if (!googleUser) return authRedirect(withNext(`${fallback}?google=unverified`, context.nextPath), request.nextUrl.origin);

    const linkedRows = await db
      .select({ userId: authAccounts.userId })
      .from(authAccounts)
      .where(and(eq(authAccounts.provider, "google"), eq(authAccounts.providerAccountId, googleUser.sub)))
      .limit(1);

    let userId = linkedRows[0]?.userId ?? null;

    if (!userId) {
      const existingRows = await db.select({ id: users.id }).from(users).where(eq(users.email, googleUser.email)).limit(1);
      userId = existingRows[0]?.id ?? null;

      if (!userId && context.intent !== "signup") {
        return authRedirect(withNext("/signup?google=account-missing", context.nextPath), request.nextUrl.origin);
      }

      if (!userId) {
        const now = new Date();
        const [created] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            passwordHash: null,
            emailVerifiedAt: now,
            termsAcceptedAt: now,
            privacyAcceptedAt: now,
            preferredLocale: locale,
          })
          .returning({ id: users.id });
        userId = created?.id ?? null;
      } else if (context.intent === "signup") {
        await db
          .update(users)
          .set({
            emailVerifiedAt: new Date(),
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
            preferredLocale: locale,
          })
          .where(eq(users.id, userId));
      } else {
        await db.update(users).set({ emailVerifiedAt: new Date(), preferredLocale: locale }).where(eq(users.id, userId));
      }

      if (!userId) return authRedirect(withNext(`${fallback}?google=failed`, context.nextPath), request.nextUrl.origin);

      await db
        .insert(authAccounts)
        .values({ userId, provider: "google", providerAccountId: googleUser.sub })
        .onConflictDoNothing();

      const linkedAfterInsert = await db
        .select({ userId: authAccounts.userId })
        .from(authAccounts)
        .where(and(eq(authAccounts.provider, "google"), eq(authAccounts.providerAccountId, googleUser.sub)))
        .limit(1);

      if (!linkedAfterInsert[0] || linkedAfterInsert[0].userId !== userId) {
        return authRedirect(withNext(`${fallback}?google=conflict`, context.nextPath), request.nextUrl.origin);
      }
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];
    if (!user) return authRedirect(withNext(`${fallback}?google=failed`, context.nextPath), request.nextUrl.origin);
    if (user.isSuspended) return authRedirect(withNext("/login?google=suspended", context.nextPath), request.nextUrl.origin);

    if (isAdmin(user.email, user.systemRole)) {
      const codeValue = randomSixDigitCode();
      const expiresAt = new Date(Date.now() + ADMIN_MFA_TTL_MS);
      await db.delete(adminLoginChallenges).where(eq(adminLoginChallenges.userId, user.id));
      const [challenge] = await db
        .insert(adminLoginChallenges)
        .values({ userId: user.id, codeHash: await hashPassword(codeValue), expiresAt })
        .returning({ id: adminLoginChallenges.id });

      if (!challenge) return authRedirect("/login?google=failed", request.nextUrl.origin);
      await setAdminChallengeCookie(challenge.id, expiresAt);

      const sent = await sendTransactionalEmail({
        to: user.email,
        subject: locale === "en" ? "BuildCrew administrator sign-in code" : "Kod logowania administratora BuildCrew",
        html: buildCrewEmail({
          locale,
          baseUrl: request.nextUrl.origin,
          eyebrow: locale === "en" ? "Account security" : "Bezpieczeństwo konta",
          title: locale === "en" ? "Sign-in code" : "Kod logowania",
          intro: locale === "en" ? "Use the code below to finish signing in to the administrator panel." : "Użyj poniższego kodu, aby dokończyć logowanie do panelu administratora.",
          content: `<div style="padding:18px 0;border-top:1px solid #E5E5DF;border-bottom:1px solid #E5E5DF;font-size:30px;line-height:38px;font-weight:700;letter-spacing:6px;color:#111111;">${codeValue}</div>`,
          footer: locale === "en" ? "The code expires after 10 minutes. If you did not try to sign in, change your password and review your active sessions." : "Kod wygasa po 10 minutach. Jeśli nie próbowałeś się logować, zmień hasło i sprawdź aktywne sesje.",
        }),
        devPreview: `${locale === "en" ? "Administrator code" : "Kod administratora"}: ${codeValue}`,
      });

      if (!sent.ok && process.env.NODE_ENV === "production") {
        await db.delete(adminLoginChallenges).where(eq(adminLoginChallenges.id, challenge.id));
        return authRedirect("/login?google=admin-email", request.nextUrl.origin);
      }

      return authRedirect("/admin-verify", request.nextUrl.origin);
    }

    const loginAt = new Date();
    await db.update(users).set({ lastLoginAt: loginAt, lastActiveAt: loginAt, preferredLocale: locale }).where(eq(users.id, user.id));
    await createSessionForUser(user.id);

    const profileRows = await db
      .select({ onboardingCompleted: profiles.onboardingCompleted })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (profileRows[0]?.onboardingCompleted) return authRedirect(context.nextPath || "/dashboard", request.nextUrl.origin);
    if (context.nextPath) await setPostAuthRedirect(context.nextPath);
    return authRedirect("/onboarding", request.nextUrl.origin);
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return authRedirect(withNext(`${fallback}?google=failed`, context?.nextPath), request.nextUrl.origin);
  }
}
