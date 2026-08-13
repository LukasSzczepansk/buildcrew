import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-600 text-white">🛠️</span>
            BuildCrew
          </Link>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <Link href="/regulamin" className="hover:text-neutral-900 dark:hover:text-white">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-neutral-900 dark:hover:text-white">Prywatność</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">{subtitle}</p>
        </div>
        <article className="space-y-9 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
          {children}
        </article>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
