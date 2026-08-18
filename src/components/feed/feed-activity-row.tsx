import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { AppLocale } from "@/lib/site-config";
import { locationLabel } from "@/lib/countries";
import { timeAgo } from "@/lib/utils";

export function FeedActivityRow({
  href,
  username,
  avatarEmoji,
  projectName,
  roleLabel,
  joinedAt,
  city,
  country,
  locale,
}: {
  href: string;
  username: string;
  avatarEmoji?: string | null;
  projectName: string;
  roleLabel?: string | null;
  joinedAt: Date;
  city?: string | null;
  country?: string | null;
  locale: AppLocale;
}) {
  const en = locale === "en";
  const location = locationLabel(city, country);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3.5 py-3 transition-colors hover:border-[var(--bc-line-strong)] sm:px-4"
    >
      <Avatar username={username} seed={avatarEmoji || username} size="sm" className="h-9 w-9 shrink-0 text-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[var(--bc-ink)] sm:text-[14px]">
          <span className="font-semibold">@{username}</span>{" "}
          <span className="text-[var(--bc-muted)]">{en ? "joined" : "dołączył(a) do"}</span>{" "}
          <span className="font-semibold">{projectName}</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[var(--bc-faint)] sm:text-[12px]">
          {[roleLabel, location, timeAgo(joinedAt, locale)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--bc-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
