import Link from "next/link";
import { Search } from "lucide-react";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import type { RoleType } from "@/db/schema";
import { cn } from "@/lib/utils";

type RoleSlot = { id: string; roleType: RoleType; slots: number; filled: number; open: number; skills: string[] };

/**
 * Visual "who is on the team and who is still missing" view: one row per role with a filled / open dot per slot.
 * Owners get a one-click link to the people directory pre-filtered for the missing role.
 */
export function TeamGaps({ roles, isOwner, locale }: { roles: RoleSlot[]; isOwner: boolean; locale: AppLocale }) {
  if (roles.length === 0) return null;
  const en = locale === "en";
  const labels = labelsFor(locale);
  const totalSlots = roles.reduce((sum, role) => sum + role.slots, 0);
  const totalFilled = roles.reduce((sum, role) => sum + Math.min(role.filled, role.slots), 0);
  const percent = totalSlots ? Math.round((totalFilled / totalSlots) * 100) : 0;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--bc-ink)]">
          {en ? `${totalFilled} of ${totalSlots} roles filled` : `Obsadzone role: ${totalFilled} z ${totalSlots}`}
        </p>
        <span className="text-[12px] tabular-nums text-[var(--bc-faint)]">{percent}%</span>
      </div>
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--bc-surface-subtle)]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={en ? "Team completeness" : "Kompletność zespołu"}
      >
        <div className="h-full rounded-full bg-[var(--bc-accent-strong)]" style={{ width: `${percent}%` }} />
      </div>

      <ul className="space-y-2.5">
        {roles.map((role) => (
          <li key={role.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{labels.roles[role.roleType]}</p>
              {role.open > 0 && role.skills.length ? (
                <p className="truncate text-[12px] text-[var(--bc-muted)]">{role.skills.slice(0, 3).join(" · ")}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1" aria-label={en ? `${role.filled} of ${role.slots} filled` : `${role.filled} z ${role.slots} obsadzone`}>
              {Array.from({ length: role.slots }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border",
                    index < role.filled ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-strong)]" : "border-dashed border-[var(--bc-line-strong)] bg-transparent",
                  )}
                />
              ))}
            </div>
            {role.open > 0 && isOwner ? (
              <Link
                href={`/builders?role=${role.roleType}`}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--bc-radius-sm)] border border-[var(--bc-line)] px-2.5 text-[12px] font-medium text-[var(--bc-ink)] transition-colors hover:bg-[var(--bc-surface-hover)]"
              >
                <Search className="h-3 w-3" aria-hidden="true" />
                {en ? "Find" : "Szukaj"}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
