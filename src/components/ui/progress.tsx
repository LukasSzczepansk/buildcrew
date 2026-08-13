import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800", className)}>
      <div className="h-full bg-neutral-950 dark:bg-lime-300 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
