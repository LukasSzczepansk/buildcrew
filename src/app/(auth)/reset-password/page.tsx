import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/recovery-forms";
import { getRequestLocale } from "@/lib/site-server";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Set a new password - BuildCrew" : "Ustaw nowe hasło - BuildCrew" };
}
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token = "" }, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const en = locale === "en";
  return <div><h1 className="mb-1 text-2xl font-bold">{en ? "Set a new password" : "Ustaw nowe hasło"}</h1><p className="mb-6 text-sm text-neutral-500">{en ? "After changing your password, all active sessions will be signed out." : "Changing your password will sign out all active sessions."}</p>{token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-red-600">{en ? "The reset token is missing." : "Brakuje tokenu resetującego."}</p>}</div>;
}
