import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/recovery-forms";
export const metadata: Metadata = { title: "Ustaw nowe hasło - BuildCrew" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <div><h1 className="mb-1 text-2xl font-bold">Ustaw nowe hasło</h1><p className="mb-6 text-sm text-neutral-500">Po zmianie hasła wszystkie aktywne sesje zostaną wylogowane.</p>{token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-red-600">Brakuje tokenu resetującego.</p>}</div>;
}
