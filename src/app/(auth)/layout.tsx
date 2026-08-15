import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Hammer } from "lucide-react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f3] px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em]">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-lime-300 text-neutral-950"><Hammer className="h-4 w-4" strokeWidth={2.5} /></span>
            BuildCrew
          </Link>
        </div>
        <div className="border border-neutral-300 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">{children}</div>
        <div className="mt-6 flex items-center justify-center gap-4 text-[13px] text-neutral-400">
          <Link href="/regulamin" className="hover:text-neutral-700 dark:hover:text-neutral-200">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="hover:text-neutral-700 dark:hover:text-neutral-200">Polityka prywatności</Link>
        </div>
      </div>
    </div>
  );
}
