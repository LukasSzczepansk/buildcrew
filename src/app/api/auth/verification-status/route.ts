import { NextResponse } from "next/server";
import { getCurrentUser, getPostAuthRedirect } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, verified: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  const pendingNext = await getPostAuthRedirect("");
  const redirectTo = user.onboardingCompleted
    ? pendingNext || "/dashboard"
    : "/onboarding";

  return NextResponse.json(
    {
      authenticated: true,
      verified: user.emailVerified,
      redirectTo,
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
