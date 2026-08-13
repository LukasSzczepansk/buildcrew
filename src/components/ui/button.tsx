import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] border text-sm font-medium transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f4ef] disabled:pointer-events-none disabled:opacity-45 cursor-pointer dark:focus-visible:ring-lime-300 dark:focus-visible:ring-offset-[var(--bc-canvas)]",
  {
    variants: {
      variant: {
        default:
          "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white",
        secondary:
          "border-[#b8df58] bg-[#c8f169] text-neutral-950 hover:bg-[#d4f58b] dark:border-lime-300 dark:bg-lime-300 dark:text-neutral-950 dark:hover:bg-lime-200",
        outline:
          "border-[#c9c9c1] bg-white text-neutral-900 hover:border-neutral-500 hover:bg-[#fafaf7] dark:border-[var(--bc-line)] dark:bg-[var(--bc-surface)] dark:text-neutral-100 dark:hover:border-neutral-500 dark:hover:bg-[var(--bc-surface-hover)]",
        ghost:
          "border-transparent bg-transparent text-neutral-700 hover:bg-black/[0.045] hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white",
        destructive: "border-red-700 bg-red-700 text-white hover:bg-red-800",
        link: "border-transparent bg-transparent p-0 text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-200",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-10 px-4 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
