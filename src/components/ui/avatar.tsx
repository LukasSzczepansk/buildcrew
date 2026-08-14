import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const PALETTES = [
  { bg: "#e9f8b9", fg: "#171b0f", ring: "#c8f169" },
  { bg: "#eef4c9", fg: "#1b1d13", ring: "#cbdc77" },
  { bg: "#e3f2d1", fg: "#172016", ring: "#b7d696" },
  { bg: "#edf1d9", fg: "#1b1d16", ring: "#d1d8a8" },
] as const;

function avatarHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

function splitUsername(value: string) {
  return value
    .trim()
    .replace(/([a-ząćęłńóśźż])([A-ZĄĆĘŁŃÓŚŹŻ])/g, "$1 $2")
    .replace(/[._\-+/]+/g, " ")
    .replace(/\d+$/g, "")
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
}

export function initialsForUsername(username: string) {
  const parts = splitUsername(username);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toLocaleUpperCase("pl-PL");
  const single = parts[0] ?? username.trim();
  if (!single) return "BC";
  return single.slice(0, Math.min(2, single.length)).toLocaleUpperCase("pl-PL");
}

function Avatar({ username, seed, emoji: _legacyEmoji, className, size = "md" }: { username?: string | null; seed?: string | null; emoji?: string | null; className?: string; size?: AvatarSize }) {
  const label = username?.trim() || "BuildCrew";
  const palette = PALETTES[avatarHash(seed?.trim() || _legacyEmoji?.trim() || label) % PALETTES.length];
  const sizes: Record<AvatarSize, string> = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-11 w-11 text-[13px]",
    lg: "h-16 w-16 text-[18px]",
    xl: "h-24 w-24 text-[28px]",
  };

  return (
    <div
      role="img"
      aria-label={`Avatar ${label}`}
      title={label}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full border font-semibold tracking-[-0.035em] text-neutral-950",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.ring }}
    >
      <span aria-hidden="true">{initialsForUsername(label)}</span>
    </div>
  );
}

export { Avatar };
