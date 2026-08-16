"use client";

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
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toLocaleUpperCase("en-US");
  const single = parts[0] ?? username.trim();
  if (!single) return "BC";
  return single.slice(0, Math.min(2, single.length)).toLocaleUpperCase("en-US");
}

function Avatar({ username, seed, emoji: _legacyEmoji, className, size = "md", disablePhoto = false }: { username?: string | null; seed?: string | null; emoji?: string | null; className?: string; size?: AvatarSize; disablePhoto?: boolean }) {
  const label = username?.trim() || "BuildCrew";
  const palette = PALETTES[avatarHash(seed?.trim() || _legacyEmoji?.trim() || label) % PALETTES.length];
  const [photoLoaded, setPhotoLoaded] = React.useState(false);
  const sizes: Record<AvatarSize, string> = {
    sm: "h-8 w-8 text-[12px]",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-[18px]",
    xl: "h-24 w-24 text-[28px]",
  };
  const photoSrc = disablePhoto || !username?.trim() ? null : `/api/avatar/${encodeURIComponent(username.trim())}`;

  React.useEffect(() => setPhotoLoaded(false), [photoSrc]);

  return (
    <div
      role="img"
      aria-label={`Avatar ${label}`}
      title={label}
      className={cn(
        "relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border font-semibold tracking-[-0.035em] text-neutral-950",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.ring }}
    >
      <span aria-hidden="true" className={photoLoaded ? "opacity-0" : "opacity-100"}>{initialsForUsername(label)}</span>
      {photoSrc ? (
        // The endpoint only returns an approved photo. A 404 simply keeps the initials fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc}
          alt=""
          aria-hidden="true"
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-150", photoLoaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoLoaded(false)}
          draggable={false}
        />
      ) : null}
    </div>
  );
}

export { Avatar };
