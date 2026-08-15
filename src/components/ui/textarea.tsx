import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[110px] w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3.5 py-3 text-[15px] text-[var(--bc-ink)] transition-[border-color,box-shadow,background-color] placeholder:text-[var(--bc-faint)] focus-visible:border-[var(--bc-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
