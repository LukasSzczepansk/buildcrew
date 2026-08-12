import type { Metadata } from "next";
import { ResendVerificationForm, VerifyEmailForm } from "@/components/auth/recovery-forms";
export const metadata: Metadata = { title: "Potwierdź e-mail — BuildCrew" };
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; sent?: string; next?: string }> }) {
  const { token, sent, next } = await searchParams;
  return <div><h1 className="mb-1 text-2xl font-bold">Potwierdź swój e-mail</h1>{token ? <><p className="mb-6 text-sm text-neutral-500">Kliknij poniżej, aby aktywować konto.</p><VerifyEmailForm token={token} nextPath={next} /></> : <><p className="mb-6 text-sm text-neutral-500">{sent ? "Wysłaliśmy link aktywacyjny. Sprawdź skrzynkę i spam." : "Aby korzystać z BuildCrew, najpierw potwierdź adres e-mail."}</p><ResendVerificationForm /></>}</div>;
}
