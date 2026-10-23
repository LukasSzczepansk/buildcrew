import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--bc-radius)] border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-canvas)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "border-[#1c1b17] bg-[#1c1b17] text-[#fffdf8] shadow-[var(--bc-shadow-sm),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#33312a] dark:border-[#f2f0e8] dark:bg-[#f2f0e8] dark:text-[#1c1b17] dark:hover:bg-white",
        secondary:
          "border-[var(--bc-accent-strong)]/60 bg-[var(--bc-accent)] text-[#1c1b17] shadow-[var(--bc-shadow-sm),inset_0_1px_0_rgba(255,255,255,0.45)] hover:border-[var(--bc-accent-strong)] hover:bg-[#bfe85a]",
        outline:
          "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-ink)] shadow-[var(--bc-shadow-xs)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)] hover:shadow-[var(--bc-shadow-sm)]",
        ghost:
          "border-transparent bg-transparent text-[var(--bc-muted)] hover:bg-[var(--bc-surface-2)] hover:text-[var(--bc-ink)] dark:hover:bg-white/[0.06] dark:hover:text-[var(--bc-ink)]",
        destructive: "border-red-700 bg-red-700 text-white shadow-[var(--bc-shadow-sm)] hover:bg-red-800",
        link: "h-auto border-transparent bg-transparent p-0 text-[var(--bc-ink)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:decoration-[var(--bc-ink)]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5 text-[14px]",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
