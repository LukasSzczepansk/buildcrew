import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[7px] border text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-canvas)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white",
        secondary:
          "border-[var(--bc-accent)] bg-[var(--bc-accent)] text-neutral-950 hover:border-[var(--bc-accent-strong)] hover:bg-[var(--bc-accent-strong)]",
        outline:
          "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-ink)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
        ghost:
          "border-transparent bg-transparent text-[var(--bc-muted)] hover:bg-black/[0.04] hover:text-[var(--bc-ink)] dark:hover:bg-white/[0.06] dark:hover:text-[var(--bc-ink)]",
        destructive: "border-red-700 bg-red-700 text-white hover:bg-red-800",
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
