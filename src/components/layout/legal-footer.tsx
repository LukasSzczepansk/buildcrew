import Link from "next/link";
import { cn } from "@/lib/utils";

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--bc-line)] pt-4 text-[11px] text-[var(--bc-faint)]",
        className,
      )}
      aria-label="Informacje prawne"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>© BuildCrew</span>
        <span aria-hidden="true">·</span>
        <Link href="/regulamin" className="transition-colors hover:text-[var(--bc-ink)]">
          Regulamin
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/polityka-prywatnosci" className="transition-colors hover:text-[var(--bc-ink)]">
          Prywatność
        </Link>
      </div>
    </footer>
  );
}
