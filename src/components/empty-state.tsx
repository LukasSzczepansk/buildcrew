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
        "border-y border-[#d8d8d0] px-1 py-12 dark:border-neutral-700",
        className,
      )}
    >
      <div className="max-w-lg">
        {icon ? <div className="mb-3 text-lg grayscale">{icon}</div> : null}
        <p className="whitespace-pre-line text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</p>
        {description ? <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p> : null}
        {ctaLabel && ctaHref ? (
          <Button asChild size="sm" className="mt-5">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
