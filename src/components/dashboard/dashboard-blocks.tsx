import Link from "next/link";
import { ArrowRight, Bell, Check, MessageCircle, Plus, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const card = "rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[var(--bc-shadow-xs)]";

/** The single most useful thing to do right now: one headline, one primary action. */
export function NextActionCard({
  eyebrow,
  title,
  description,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className={cn(card, "relative isolate overflow-hidden p-6 shadow-[var(--bc-shadow-sm)] sm:p-7")}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 -z-10 h-56 w-56 rounded-full bg-[var(--bc-accent)]/25 blur-[70px]" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="bc-kicker">{eyebrow}</p>
          <h2 className="bc-display mt-2 max-w-[640px] text-[28px] leading-[1.1] tracking-[-0.01em] sm:text-[34px]">{title}</h2>
          {description ? <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-[var(--bc-muted)]">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild size="lg"><Link href={primary.href}>{primary.label} <ArrowRight className="h-4 w-4" /></Link></Button>
          {secondary ? <Button asChild size="lg" variant="outline"><Link href={secondary.href}>{secondary.label}</Link></Button> : null}
        </div>
      </div>
    </section>
  );
}

type AttentionRow = { href: string; icon: "messages" | "notifications" | "applications"; label: string; value: number };

const ICONS = { messages: MessageCircle, notifications: Bell, applications: Users2 } as const;

/** Inbox-style counters. Zero is quiet; anything waiting gets an accent pill so it is spotted instantly. */
export function AttentionList({ title, rows, allClear }: { title: string; rows: AttentionRow[]; allClear: string }) {
  const waiting = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <section className={card} aria-label={title}>
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{title}</h2>
        {waiting === 0 ? <span className="inline-flex items-center gap-1 text-[12px] text-[var(--bc-accent-ink)]"><Check className="h-3.5 w-3.5" aria-hidden="true" />{allClear}</span> : null}
      </div>
      <ul className="p-2">
        {rows.map((row) => {
          const Icon = ICONS[row.icon];
          const active = row.value > 0;
          return (
            <li key={row.icon}>
              <Link href={row.href} className="flex min-h-11 items-center gap-3 rounded-[var(--bc-radius)] px-2.5 py-2 transition-colors hover:bg-[var(--bc-surface-subtle)]">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", active ? "bg-[var(--bc-accent-soft)] text-[var(--bc-accent-ink)]" : "bg-[var(--bc-surface-2)] text-[var(--bc-faint)]")}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className={cn("min-w-0 flex-1 text-[14px]", active ? "font-medium text-[var(--bc-ink)]" : "text-[var(--bc-muted)]")}>{row.label}</span>
                <span
                  className={cn(
                    "min-w-7 rounded-full px-2 py-0.5 text-center text-[13px] font-semibold tabular-nums",
                    active ? "bg-[var(--bc-accent)] text-[#1c1b17]" : "text-[var(--bc-faint)]",
                  )}
                >
                  {row.value}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Compact profile progress with the missing items as direct links to the profile editor. */
export function ProfileProgress({
  title,
  score,
  missing,
  cta,
  hint,
}: {
  title: string;
  score: number;
  missing: string[];
  cta: string;
  hint?: string;
}) {
  return (
    <section className={cn(card, "p-4")} aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--bc-ink)]">{title}</h2>
        <span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--bc-ink)]">{score}%</span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bc-surface-2)]"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div className="h-full rounded-full bg-[var(--bc-accent-strong)]" style={{ width: `${score}%` }} />
      </div>
      {missing.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {missing.slice(0, 3).map((item) => (
            <li key={item}>
              <Link href="/profile" className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--bc-line-strong)] px-2.5 py-1 text-[12px] text-[var(--bc-muted)] transition-colors hover:border-[var(--bc-accent-strong)] hover:text-[var(--bc-ink)]">
                <Plus className="h-3 w-3" aria-hidden="true" />{item}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="mt-3 text-[12px] leading-5 text-[var(--bc-faint)]">{hint}</p> : null}
      <Button asChild size="sm" variant="outline" className="mt-3 w-full"><Link href="/profile">{cta}</Link></Button>
    </section>
  );
}

export function QuickLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-[13px]" aria-label="Shortcuts">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 font-medium text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-ink)]">
          {link.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}
