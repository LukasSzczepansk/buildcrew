import { Check, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Decorative, code-drawn previews of real BuildCrew screens for the landing page.
 * They carry no information a screen reader needs, so the wrappers are aria-hidden.
 */

const surface = "rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[var(--bc-shadow-md)]";

function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--bc-accent-strong)]/50 bg-[var(--bc-accent-soft)] text-[12px] font-semibold text-[var(--bc-accent-ink)]", className)}>
      {letters}
    </span>
  );
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "accent" | "open" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-medium",
        tone === "plain" && "border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-[var(--bc-muted)]",
        tone === "accent" && "border-[var(--bc-accent-strong)]/50 bg-[var(--bc-accent-soft)] text-[var(--bc-accent-ink)]",
        tone === "open" && "border-dashed border-[var(--bc-line-strong)] text-[var(--bc-ink)]",
      )}
    >
      {children}
    </span>
  );
}

export function ProjectMock({
  name,
  tagline,
  roles,
  stack,
  filled,
  total,
  className,
}: {
  name: string;
  tagline: string;
  roles: string[];
  stack: string[];
  filled: number;
  total: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn(surface, "p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--bc-radius)] bg-[#1c1b17] text-[15px] font-semibold text-[#c8f169]">{name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--bc-ink)]">{name}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[var(--bc-muted)]">{tagline}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {roles.map((role) => <Chip key={role} tone="open">{role}</Chip>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {stack.map((item) => <Chip key={item}>{item}</Chip>)}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bc-surface-2)]">
          <div className="h-full rounded-full bg-[var(--bc-accent-strong)]" style={{ width: `${Math.round((filled / total) * 100)}%` }} />
        </div>
        <span className="text-[12px] tabular-nums text-[var(--bc-faint)]">{filled}/{total}</span>
      </div>
    </div>
  );
}

export function PersonMock({
  name,
  role,
  skills,
  match,
  className,
}: {
  name: string;
  role: string;
  skills: string[];
  match?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn(surface, "p-4", className)}>
      <div className="flex items-center gap-3">
        <Initials name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[var(--bc-ink)]">{name}</p>
          <p className="truncate text-[12px] text-[var(--bc-muted)]">{role}</p>
        </div>
        {match ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bc-accent)] px-2.5 py-1 text-[12px] font-semibold text-[#1c1b17]">
            <Sparkles className="h-3 w-3" />{match}%
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((skill) => <Chip key={skill}>{skill}</Chip>)}
      </div>
    </div>
  );
}

export function ChatMock({ lines, className }: { lines: { mine?: boolean; text: string }[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn(surface, "space-y-2 p-4", className)}>
      {lines.map((line, index) => (
        <div key={index} className={cn("flex", line.mine ? "justify-end" : "justify-start")}>
          <span
            className={cn(
              "max-w-[85%] rounded-[14px] px-3 py-2 text-[13px] leading-5",
              line.mine ? "rounded-br-[4px] bg-[#1c1b17] text-[#fffdf8]" : "rounded-bl-[4px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-[var(--bc-ink)]",
            )}
          >
            {line.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TasksMock({ tasks, className }: { tasks: { title: string; done?: boolean; who: string }[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn(surface, "divide-y divide-[var(--bc-line)]", className)}>
      {tasks.map((task) => (
        <div key={task.title} className="flex items-center gap-3 px-4 py-3">
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", task.done ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)]" : "border-[var(--bc-line-strong)]")}>
            {task.done ? <Check className="h-3 w-3 text-[#1c1b17]" strokeWidth={3} /> : null}
          </span>
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", task.done ? "text-[var(--bc-faint)] line-through" : "text-[var(--bc-ink)]")}>{task.title}</span>
          <Initials name={task.who} className="h-6 w-6 text-[10px]" />
        </div>
      ))}
    </div>
  );
}

export function RoleFormMock({ title, note, roles, className }: { title: string; note: string; roles: { label: string; active?: boolean }[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn(surface, "space-y-3 p-4", className)}>
      <div className="h-9 rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-3 text-[13px] leading-9 text-[var(--bc-ink)]">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => <Chip key={role.label} tone={role.active ? "accent" : "plain"}>{role.active ? "+ " : ""}{role.label}</Chip>)}
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]">
        <MessageCircle className="h-3.5 w-3.5" /> {note}
      </div>
    </div>
  );
}
