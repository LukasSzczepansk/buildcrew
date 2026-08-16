import type { Metadata } from "next";
import { AdminVerifyForm } from "@/components/auth/recovery-forms";
export const metadata: Metadata = { title: "Administrator verification - BuildCrew" };
export default function AdminVerifyPage() { return <div><h1 className="mb-1 text-2xl font-bold">Additional verification</h1><p className="mb-6 text-sm text-neutral-500">We sent a 6-digit code to the administrator email address.</p><AdminVerifyForm /></div>; }
