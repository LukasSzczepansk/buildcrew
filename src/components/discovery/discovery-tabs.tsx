import Link from "next/link";

export function DiscoveryTabs({
  active,
  counts,
}: {
  active: "projects" | "hackathons" | "ideas" | "people";
  counts?: Partial<Record<"projects" | "hackathons" | "ideas" | "people", number>>;
}) {
  const tabs = [
    { key: "projects", label: "Projekty", href: "/projects" },
    { key: "hackathons", label: "Hackathony", href: "/hackathons" },
    { key: "ideas", label: "Pomysły", href: "/ideas" },
    { key: "people", label: "Ludzie chcący budować", href: "/build" },
  ] as const;

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--bc-line)] px-1 text-sm" aria-label="Odkrywanie BuildCrew">
      {tabs.map((tab) => {
        const selected = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`relative flex h-10 shrink-0 items-center gap-2 px-3 transition-colors ${selected ? "bg-[var(--bc-surface-subtle)] font-semibold text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"}`}
          >
            {tab.label}
            {typeof count === "number" ? <span className={`tabular-nums ${selected ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]"}`}>{count}</span> : null}
            {selected ? <span className="absolute inset-x-3 bottom-[-1px] h-[2px] bg-[var(--bc-accent)]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
