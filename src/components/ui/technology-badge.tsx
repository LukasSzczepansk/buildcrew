import { cn } from "@/lib/utils";

function normalizeTech(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+.#]/g, "");
}

function initials(label: string) {
  return label
    .split(/[\s/+-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function TechIcon({ label }: { label: string }) {
  const key = normalizeTech(label);

  if (["react", "reactjs", "reactnative"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-500" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="12" rx="9" ry="3.7" stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="12" cy="12" rx="9" ry="3.7" stroke="currentColor" strokeWidth="1.6" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.7" stroke="currentColor" strokeWidth="1.6" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    );
  }

  if (["typescript", "ts"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[#3178c6]">TS</span>;
  }

  if (["javascript", "js"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[#b78a00]">JS</span>;
  }

  if (["nextjs", "next", "next.js"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-neutral-900 dark:text-white">N</span>;
  }

  if (["nodejs", "node", "node.js"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-500" fill="none" aria-hidden="true">
        <path d="M12 2.8 19.2 7v10L12 21.2 4.8 17V7 2.8Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.7v8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (["vue", "vuejs"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M4 5h4.2L12 11 15.8 5H20l-8 14L4 5Z" fill="#41B883" />
        <path d="M7 5h2.4L12 9.2 14.6 5H17l-5 8.8L7 5Z" fill="#34495E" />
      </svg>
    );
  }

  if (["svelte", "sveltekit"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[#ff5b2d]">S</span>;
  }

  if (["tailwindcss", "tailwind"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-cyan-500" fill="none" aria-hidden="true">
        <path d="M6 9.5c1.4-2 2.8-2.8 4.4-2.6 1 .1 1.8.7 2.8 1.8 1 1 1.7 1.4 2.6 1.5 1.5.1 2.8-.6 4.2-2.2-1.4 2-2.8 2.8-4.4 2.7-1-.1-1.8-.7-2.8-1.8-1-1-1.6-1.4-2.6-1.5-1.5-.1-2.8.6-4.2 2.1Zm-2 6c1.4-2 2.8-2.8 4.4-2.7 1 .1 1.8.7 2.8 1.8 1 1 1.7 1.4 2.6 1.5 1.5.1 2.8-.6 4.2-2.1-1.4 2-2.8 2.8-4.4 2.7-1-.1-1.8-.7-2.8-1.8-1-1-1.6-1.4-2.6-1.5-1.5-.1-2.8.6-4.2 2.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (["python", "py"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-[#3d7ab8]">Py</span>;
  }

  if (["postgresql", "postgres", "psql"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-600" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6.4" rx="5.8" ry="2.6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.2 6.4v8.2c0 1.4 2.6 2.6 5.8 2.6s5.8-1.2 5.8-2.6V6.4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.2 10.5c0 1.5 2.6 2.7 5.8 2.7s5.8-1.2 5.8-2.7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (["mongodb", "mongo", "mongoose"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600" fill="none" aria-hidden="true">
        <path d="M12 3c2.3 2.7 3.7 5.2 3.7 8 0 3.5-1.6 6-3.7 9-2-3-3.7-5.5-3.7-9 0-2.8 1.4-5.3 3.7-8Z" fill="currentColor" />
        <path d="M12 5.3v11.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (["docker"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-500" fill="none" aria-hidden="true">
        <path d="M6 10h2v2H6zm3 0h2v2H9zm3 0h2v2h-2zm-3-3h2v2H9zm3 0h2v2h-2zm3 3h2v2h-2z" fill="currentColor" />
        <path d="M4.5 13.5h11.4c.7 0 1.4-.2 2-.6.9-.6 1.6-1.6 1.8-3 .5.2 1 .2 1.8-.1-.1.7-.3 1.3-.6 2-.8 1.8-2.5 3.2-4.5 3.2H9.2c-2.1 0-3.8-.5-4.7-1.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (["figma"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="9" cy="6" r="3" fill="#F24E1E" />
        <circle cx="15" cy="6" r="3" fill="#A259FF" />
        <circle cx="9" cy="12" r="3" fill="#FF7262" />
        <circle cx="15" cy="12" r="3" fill="#1ABCFE" />
        <circle cx="9" cy="18" r="3" fill="#0ACF83" />
      </svg>
    );
  }

  if (["firebase"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M6 18.5 10.8 5.2a.8.8 0 0 1 1.5-.1l1.8 3.5-8.1 9.9Z" fill="#FFA000" />
        <path d="m6 18.5 2.8-17a.8.8 0 0 1 1.4-.4L18 9.2 6 18.5Z" fill="#F57C00" />
        <path d="M6 18.5 18 9.2l-1.1 10.2a.8.8 0 0 1-1 .7L6 18.5Z" fill="#FFCA28" />
      </svg>
    );
  }

  if (["supabase"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M13.3 3.7c.3-.4.7-.7 1.2-.7h4.1c1.1 0 1.8 1.2 1.2 2.1l-8.1 14.2c-.3.4-.7.7-1.2.7H6.4c-1.1 0-1.8-1.2-1.2-2.1L13.3 3.7Z" fill="#3ECF8E" />
        <path d="M13.5 3h5.1c1 0 1.6 1.1 1.1 1.9l-8.2 14.4c-.3.5-.9.7-1.4.5a1.2 1.2 0 0 1-.7-1.1V7.1c0-.4.1-.7.3-1L13.5 3Z" fill="#2AA36B" />
      </svg>
    );
  }

  if (["stripe"].includes(key)) {
    return <span className="text-[9px] font-black uppercase tracking-[0.02em] text-[#635bff]">S</span>;
  }

  if (["html", "htmlcss", "css", "html/css"].includes(key)) {
    return <span className="text-[9px] font-bold uppercase tracking-[0.02em] text-orange-500">&lt;/&gt;</span>;
  }

  if (["gemini", "geminiapi"].includes(key)) {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-indigo-500" fill="none" aria-hidden="true">
        <path d="M12 4.4 13.9 9 18.5 11 13.9 13 12 17.6 10.1 13 5.5 11l4.6-2 1.9-4.6Z" fill="currentColor" />
      </svg>
    );
  }

  return <span className="text-[9px] font-semibold uppercase tracking-[0.02em] text-[var(--bc-faint)]">{initials(label)}</span>;
}

export function TechnologyBadge({
  label,
  className,
  compact = false,
}: {
  label: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-ink)]",
        compact ? "min-h-7 px-2 py-1 text-[11px]" : "min-h-8 px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-black/[0.045] dark:bg-white/[0.06]">
        <TechIcon label={label} />
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

export function TechnologyStack({
  items,
  max = 5,
  compact = false,
  className,
}: {
  items: string[];
  max?: number;
  compact?: boolean;
  className?: string;
}) {
  const visible = items.slice(0, max);
  const remaining = Math.max(0, items.length - visible.length);

  if (!visible.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visible.map((item) => (
        <TechnologyBadge key={item} label={item} compact={compact} />
      ))}
      {remaining > 0 ? (
        <span className={cn("inline-flex items-center rounded-[6px] border border-dashed border-[var(--bc-line)] text-[var(--bc-muted)]", compact ? "min-h-7 px-2 py-1 text-[11px]" : "min-h-8 px-2.5 py-1 text-[12px]")}>+{remaining}</span>
      ) : null}
    </div>
  );
}
