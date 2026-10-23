import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRequestLocale } from "@/lib/site-server";

export default async function NotFound() {
  const en = (await getRequestLocale()) === "en";
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-3 px-4 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">404</p>
      <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">{en ? "Page not found" : "Nie znaleziono strony"}</h1>
      <p className="text-sm leading-5 text-[var(--bc-muted)]">
        {en ? "This page does not exist, was moved, or you do not have access to it." : "Ta strona nie istnieje, została przeniesiona albo nie masz do niej dostępu."}
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild><Link href="/dashboard">{en ? "Go to dashboard" : "Przejdź do panelu"}</Link></Button>
        <Button asChild variant="outline"><Link href="/explore/projects">{en ? "Browse projects" : "Przeglądaj projekty"}</Link></Button>
      </div>
    </div>
  );
}
