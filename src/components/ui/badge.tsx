import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-[6px] border px-2 py-1 text-[12px] font-medium leading-4 transition-colors", {
  variants: {
    variant: {
      default: "border-[var(--bc-accent)] bg-[var(--bc-accent-soft)] text-neutral-950",
      secondary: "border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-[var(--bc-muted)]",
      outline: "border-[var(--bc-line)] bg-transparent text-[var(--bc-muted)]",
      success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300",
      warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300",
      destructive: "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300",
    },
  },
  defaultVariants: { variant: "default" },
});

export type BadgeProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
