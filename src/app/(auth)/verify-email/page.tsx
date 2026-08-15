import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutoVerifyEmail } from "@/components/auth/auto-verify-email";
import { VerificationWaitingRoom } from "@/components/auth/verification-waiting-room";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Potwierdź e-mail — BuildCrew" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string; next?: string }>;
}) {
  const { token, sent, next } = await searchParams;

  if (token) {
    return (
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Weryfikacja konta</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">Potwierdzamy Twój e-mail</h1>
        <p className="mt-3 mb-6 text-[14px] leading-6 text-[var(--bc-muted)]">To potrwa tylko chwilę.</p>
        <AutoVerifyEmail token={token} nextPath={next} />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  return <VerificationWaitingRoom email={user.email} initialCooldown={sent === "1"} />;
}
