import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium leading-4 transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#b8df58] bg-[#e8f9bd] text-neutral-900 dark:border-lime-700 dark:bg-lime-950/20 dark:text-lime-200",
        secondary: "border-[#d8d8d0] bg-[#efefe9] text-neutral-700 dark:border-neutral-700 dark:bg-[#20201d] dark:text-neutral-300",
        outline: "border-[#d8d8d0] bg-transparent text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
        success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300",
        warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300",
        destructive: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
