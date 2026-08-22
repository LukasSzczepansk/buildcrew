import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";

export async function LaunchesHeader() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  const startHref = user ? "/dashboard" : "/";
  return (
    <header className="border-b border-[var(--bc-line)] bg-[var(--bc-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={startHref} className="flex shrink-0 items-center gap-2 text-[16px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]"><span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-neutral-950 text-[11px] font-semibold text-white dark:bg-white dark:text-neutral-950">BC</span><span className="hidden sm:inline">BuildCrew</span></Link>
        <nav className="hidden min-w-0 items-center gap-5 text-[13px] text-[var(--bc-muted)] md:flex">
          <Link href={startHref} className="hover:text-[var(--bc-ink)]">{en ? "Home" : "Start"}</Link>
          <Link href={user ? "/builders" : "/#people"} className="hover:text-[var(--bc-ink)]">{en ? "People" : "Ludzie"}</Link>
          <Link href={user ? "/projects" : "/explore/projects"} className="hover:text-[var(--bc-ink)]">{en ? "Projects" : "Projekty"}</Link>
          <Link href="/launches" className="font-semibold text-[var(--bc-ink)]">{en ? "Launches" : "Premiery"}</Link>
          <Link href={user ? "/feed" : "/login?next=/feed"} className="hover:text-[var(--bc-ink)]">{en ? "Community" : "Społeczność"}</Link>
          {user ? <Link href="/messages" className="hover:text-[var(--bc-ink)]">{en ? "Messages" : "Wiadomości"}</Link> : null}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
          <ThemeToggle />
          {user ? <Button asChild size="sm"><Link href="/launches/new">{en ? "Show project" : "Pokaż projekt"}</Link></Button> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/login?next=/launches">{en ? "Log in" : "Zaloguj się"}</Link></Button><Button asChild size="sm"><Link href="/signup">{en ? "Join" : "Dołącz"}</Link></Button></>}
        </div>
      </div>
      <nav className="mx-auto flex max-w-[1240px] gap-5 overflow-x-auto border-t border-[var(--bc-line)] px-4 py-2.5 text-[11px] font-medium text-[var(--bc-muted)] md:hidden">
        <Link href={startHref} className="shrink-0 hover:text-[var(--bc-ink)]">{en ? "Home" : "Start"}</Link>
        <Link href={user ? "/builders" : "/#people"} className="shrink-0 hover:text-[var(--bc-ink)]">{en ? "People" : "Ludzie"}</Link>
        <Link href={user ? "/projects" : "/explore/projects"} className="shrink-0 hover:text-[var(--bc-ink)]">{en ? "Projects" : "Projekty"}</Link>
        <Link href="/launches" className="shrink-0 font-semibold text-[var(--bc-ink)]">{en ? "Launches" : "Premiery"}</Link>
        <Link href={user ? "/feed" : "/login?next=/feed"} className="shrink-0 hover:text-[var(--bc-ink)]">{en ? "Community" : "Społeczność"}</Link>
        {user ? <Link href="/messages" className="shrink-0 hover:text-[var(--bc-ink)]">{en ? "Messages" : "Wiadomości"}</Link> : null}
      </nav>
    </header>
  );
}
