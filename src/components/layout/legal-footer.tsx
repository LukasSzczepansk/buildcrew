import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRequestLocale } from "@/lib/site-server";

export async function LegalFooter({ className }: { className?: string }) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  return (
    <footer
      className={cn(
        "border-t border-[var(--bc-line)] pt-4 text-[12px] text-[var(--bc-faint)]",
        className,
      )}
      aria-label={en ? "Legal information" : "Informacje prawne"}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>© BuildCrew</span>
        <span aria-hidden="true">·</span>
        <Link href={en ? "/terms" : "/regulamin"} className="transition-colors hover:text-[var(--bc-ink)]">
          {en ? "Terms" : "Regulamin"}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={en ? "/privacy" : "/polityka-prywatnosci"} className="transition-colors hover:text-[var(--bc-ink)]">
          {en ? "Privacy" : "Prywatność"}
        </Link>
      </div>
    </footer>
  );
}
