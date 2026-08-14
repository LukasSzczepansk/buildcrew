import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, ctaLabel, ctaHref, className }: { icon?: React.ReactNode; title: string; description?: string; ctaLabel?: string; ctaHref?: string; className?: string; }) {
  return (
    <div className={cn("rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-5 py-9", className)}>
      <div className="max-w-lg">
        {icon ? <div className="mb-3 text-lg grayscale">{icon}</div> : null}
        <p className="whitespace-pre-line text-[16px] font-semibold text-[var(--bc-ink)]">{title}</p>
        {description ? <p className="mt-1.5 text-sm leading-5 text-[var(--bc-muted)]">{description}</p> : null}
        {ctaLabel && ctaHref ? <Button asChild size="sm" className="mt-5"><Link href={ctaHref}>{ctaLabel}</Link></Button> : null}
      </div>
    </div>
  );
}
