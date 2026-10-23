import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--bc-radius-sm)] bg-[var(--bc-surface-subtle)]", className)} {...props} />;
}

/** Generic page placeholder: title block, optional filter row and a stack of list rows. */
export function ListPageSkeleton({ rows = 6, filters = true }: { rows?: number; filters?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 border-b border-[var(--bc-line)] pb-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-[520px]" />
      </div>
      {filters ? (
        <div className="mb-5 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full max-w-[340px]" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      ) : null}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-3 rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
