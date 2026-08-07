import * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({
  emoji,
  className,
  size = "md",
}: {
  emoji: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-11 w-11 text-xl",
    lg: "h-16 w-16 text-3xl",
    xl: "h-24 w-24 text-5xl",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/20",
        sizes[size],
        className,
      )}
    >
      <span>{emoji}</span>
    </div>
  );
}

export { Avatar };
