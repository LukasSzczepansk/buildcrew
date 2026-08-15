import { Crown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemRole } from "@/db/schema";

export function UserRoleBadge({
  systemRole,
  founder = false,
  compact = false,
  className,
}: {
  systemRole?: SystemRole | null;
  founder?: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (founder) {
    return (
      <span
        title="Founder BuildCrew"
        className={cn(
          "inline-flex items-center gap-1 rounded-[5px] border border-[#b6dc55] bg-[#C8F169] font-semibold uppercase tracking-[0.08em] text-neutral-950",
          compact ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]",
          className,
        )}
      >
        <Crown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
        Founder
      </span>
    );
  }

  if (systemRole === "ADMIN") {
    return (
      <span
        title="Administrator BuildCrew"
        className={cn(
          "inline-flex items-center gap-1 rounded-[5px] border border-neutral-950 bg-neutral-950 font-semibold uppercase tracking-[0.08em] text-white dark:border-white dark:bg-white dark:text-neutral-950",
          compact ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]",
          className,
        )}
      >
        <ShieldCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
        Admin
      </span>
    );
  }

  if (systemRole === "MODERATOR") {
    return (
      <span
        title="Moderator BuildCrew"
        className={cn(
          "inline-flex items-center gap-1 rounded-[5px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] font-semibold uppercase tracking-[0.08em] text-[var(--bc-muted)]",
          compact ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]",
          className,
        )}
      >
        <ShieldCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
        Mod
      </span>
    );
  }

  return null;
}
