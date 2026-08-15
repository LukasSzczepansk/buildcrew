"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/server/actions/auth";
import {
  adminVerifyAction,
  forgotPasswordAction,
  resetPasswordAction,
  resendVerificationAction,
  verifyEmailAction,
} from "@/server/actions/auth";

function StateMessage({ state }: { state: AuthFormState }) {
  if (state.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{state.error}</p>;
  if (state.success) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{state.success}</p>;
  return null;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(forgotPasswordAction, {});
  return <form action={action} className="space-y-5">
    <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
    <StateMessage state={state} />
    <Button className="w-full" size="lg" disabled={pending}>{pending ? "Wysyłamy…" : "Wyślij link do resetu"}</Button>
    <p className="text-center text-sm text-neutral-500"><Link href="/login" className="text-lime-600 hover:underline">Wróć do logowania</Link></p>
  </form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordAction, {});
  return <form action={action} className="space-y-5">
    <input type="hidden" name="token" value={token} />
    <div className="space-y-1.5"><Label htmlFor="password">Nowe hasło</Label><Input id="password" name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /><p className="text-[13px] text-neutral-400">Minimum 12 znaków.</p></div>
    <div className="space-y-1.5"><Label htmlFor="confirmPassword">Powtórz hasło</Label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></div>
    <StateMessage state={state} />
    <Button className="w-full" size="lg" disabled={pending}>{pending ? "Zapisujemy…" : "Ustaw nowe hasło"}</Button>
  </form>;
}


export function ResendVerificationForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(async (_prev, formData) => {
    void formData;
    return resendVerificationAction();
  }, {});
  return <form action={action} className="space-y-3"><StateMessage state={state}/><Button className="w-full" size="lg" disabled={pending}>{pending ? "Wysyłamy…" : "Wyślij link ponownie"}</Button></form>;
}

export function VerifyEmailForm({ token, nextPath }: { token: string; nextPath?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(verifyEmailAction, {});
  return <form action={action} className="space-y-5">
    <input type="hidden" name="token" value={token} />
    {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
    <StateMessage state={state} />
    <Button className="w-full" size="lg" disabled={pending}>{pending ? "Potwierdzamy…" : "Potwierdź e-mail"}</Button>
  </form>;
}

export function AdminVerifyForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(adminVerifyAction, {});
  return <form action={action} className="space-y-5">
    <div className="space-y-1.5"><Label htmlFor="code">Kod 2FA</Label><Input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="123456" required /></div>
    <StateMessage state={state} />
    <Button className="w-full" size="lg" disabled={pending}>{pending ? "Sprawdzamy…" : "Potwierdź logowanie"}</Button>
    <p className="text-center text-[13px] text-neutral-500">Kod jest ważny 10 minut i działa tylko raz.</p>
  </form>;
}
