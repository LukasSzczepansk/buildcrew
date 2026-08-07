import type { Metadata } from "next";
import { AdminVerifyForm } from "@/components/auth/recovery-forms";
export const metadata: Metadata = { title: "Weryfikacja administratora — BuildCrew" };
export default function AdminVerifyPage() { return <div><h1 className="mb-1 text-2xl font-bold">Dodatkowa weryfikacja</h1><p className="mb-6 text-sm text-neutral-500">Wysłaliśmy 6-cyfrowy kod na e-mail administratora.</p><AdminVerifyForm /></div>; }
