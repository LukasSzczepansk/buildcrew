import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/recovery-forms";
import { getRequestLocale } from "@/lib/site-server";
export const metadata: Metadata = { title: "Reset password - BuildCrew" };
export default async function ForgotPasswordPage() {
  const en = (await getRequestLocale()) === "en";
  return <div><h1 className="mb-1 text-2xl font-bold">{en ? "Forgot your password?" : "Nie pamiętasz hasła?"}</h1><p className="mb-6 text-sm text-neutral-500">{en ? "Enter your email. If the account exists, we’ll send you a one-time reset link." : "Podaj e-mail. Jeśli konto istnieje, wyślemy jednorazowy link."}</p><ForgotPasswordForm /></div>;
}
