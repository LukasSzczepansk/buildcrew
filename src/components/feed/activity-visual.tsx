import { FlagTriangleRight, Rocket, Sparkles, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

function hash(value: string) {
  return [...value].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 17);
}

export function ActivityVisual({
  title,
  label,
  kind = "project",
  className,
  compact = false,
}: {
  title: string;
  label?: string | null;
  kind?: "project" | "people" | "launch" | "milestone";
  className?: string;
  compact?: boolean;
}) {
  const seed = hash(`${title}:${label ?? ""}`);
  const hueA = seed % 360;
  const hueB = (hueA + 52 + (seed % 31)) % 360;
  const Icon = kind === "people" ? Users2 : kind === "launch" ? Rocket : kind === "milestone" ? FlagTriangleRight : Sparkles;
  const initials = title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  if (compact) {
    return (
      <div
        className={cn("relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-white/10 text-white", className)}
        style={{ background: `linear-gradient(135deg, hsl(${hueA} 55% 28%), hsl(${hueB} 60% 43%))` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_44%)]" />
        <span className="relative text-[16px] font-semibold tracking-[-0.04em]">{initials || "BC"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full min-h-[150px] overflow-hidden rounded-[10px] border border-black/5 text-white", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hueA} 55% 24%), hsl(${hueB} 62% 40%))` }}
    >
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/15 bg-white/5" />
      <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full border border-white/10 bg-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_34%)]" />
      <div className="relative flex h-full min-h-[150px] flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]">{label || "BuildCrew"}</span>
          <Icon className="h-4 w-4 opacity-80 sm:h-5 sm:w-5" />
        </div>
        <div>
          <p className="text-[28px] font-semibold tracking-[-0.04em] opacity-95 sm:text-[38px]">{initials || "BC"}</p>
          <p className="mt-1 truncate text-[12px] font-medium text-white/85 sm:text-[13px]">{title}</p>
        </div>
      </div>
    </div>
  );
}
