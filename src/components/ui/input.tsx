import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-[6px] border border-[#c9c9c1] bg-white px-3 py-2 text-sm text-neutral-950 transition-[border-color,box-shadow] placeholder:text-neutral-400 focus-visible:border-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-[#171715] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-neutral-400 dark:focus-visible:ring-white/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
