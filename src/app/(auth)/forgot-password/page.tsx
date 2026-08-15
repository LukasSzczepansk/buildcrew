import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/recovery-forms";
export const metadata: Metadata = { title: "Reset hasła - BuildCrew" };
export default function ForgotPasswordPage() { return <div><h1 className="mb-1 text-2xl font-bold">Nie pamiętasz hasła?</h1><p className="mb-6 text-sm text-neutral-500">Podaj e-mail. Jeśli konto istnieje, wyślemy jednorazowy link.</p><ForgotPasswordForm /></div>; }
