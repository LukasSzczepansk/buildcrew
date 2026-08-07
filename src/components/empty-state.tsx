import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/40",
        className,
      )}
    >
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <p className="max-w-sm whitespace-pre-line text-sm font-medium text-neutral-600 dark:text-neutral-300">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p>}
      {ctaLabel && ctaHref && (
        <Button asChild className="mt-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
