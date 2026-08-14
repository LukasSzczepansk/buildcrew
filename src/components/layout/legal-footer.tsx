import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/cookie-settings-button";
import { cn } from "@/lib/utils";

export function LegalFooter({ className }: { className?: string }) {
  const linkClass = "transition-colors hover:text-[var(--bc-ink)]";

  return (
    <footer
      className={cn("border-t border-[var(--bc-line)] pt-4 text-[11px] text-[var(--bc-faint)]", className)}
      aria-label="Informacje prawne"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>© BuildCrew</span>
        <span aria-hidden="true">·</span>
        <Link href="/regulamin" className={linkClass}>Regulamin</Link>
        <span aria-hidden="true">·</span>
        <Link href="/polityka-prywatnosci" className={linkClass}>Prywatność</Link>
        <span aria-hidden="true">·</span>
        <CookieSettingsButton className={linkClass} />
      </div>
    </footer>
  );
}
