import { Rocket, Sparkles, Users2 } from "lucide-react";

function hash(value: string) { return [...value].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 17); }

export function ActivityVisual({ title, label, kind = "project" }: { title: string; label?: string | null; kind?: "project" | "people" | "launch" }) {
  const seed = hash(`${title}:${label ?? ""}`);
  const hueA = seed % 360;
  const hueB = (hueA + 52 + (seed % 31)) % 360;
  const Icon = kind === "people" ? Users2 : kind === "launch" ? Rocket : Sparkles;
  const initials = title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="relative min-h-[126px] overflow-hidden rounded-[7px] border border-black/5 text-white" style={{ background: `linear-gradient(135deg, hsl(${hueA} 55% 28%), hsl(${hueB} 60% 43%))` }}>
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/15 bg-white/5" />
      <div className="absolute -bottom-14 left-10 h-36 w-36 rounded-full border border-white/10 bg-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.15),transparent_34%)]" />
      <div className="relative flex h-full min-h-[126px] flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-3"><span className="rounded-full border border-white/20 bg-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{label || "BuildCrew"}</span><Icon className="h-4 w-4 opacity-80" /></div>
        <div><p className="text-[30px] font-semibold tracking-[-0.04em] opacity-90">{initials || "BC"}</p><p className="mt-1 truncate text-[12px] font-medium text-white/85">{title}</p></div>
      </div>
    </div>
  );
}
