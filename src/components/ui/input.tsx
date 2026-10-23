import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3.5 py-2 text-[15px] shadow-[inset_0_1px_2px_rgba(40,34,12,0.04)] text-[var(--bc-ink)] transition-[border-color,box-shadow,background-color] placeholder:text-[var(--bc-faint)] hover:border-[var(--bc-line-strong)] focus-visible:border-[var(--bc-accent-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--bc-accent)]/35 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
