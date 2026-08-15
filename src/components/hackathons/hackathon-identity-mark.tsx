import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "H";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function HackathonIdentityMark({ name, coverImageUrl, className }: { name: string; coverImageUrl?: string | null; className?: string }) {
  if (coverImageUrl) {
    return (
      <div
        role="img"
        aria-label={`Grafika wydarzenia ${name}`}
        className={cn("h-14 w-14 shrink-0 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] bg-cover bg-center", className)}
        style={{ backgroundImage: `url(${JSON.stringify(coverImageUrl)})` }}
      />
    );
  }
  return (
    <div className={cn("relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] text-[16px] font-semibold tracking-[-0.02em]", className)} aria-hidden="true">
      <span className="absolute inset-y-0 left-0 w-[4px] bg-[var(--bc-accent)]" />
      {initials(name)}
    </div>
  );
}
