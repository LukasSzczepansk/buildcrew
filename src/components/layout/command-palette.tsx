"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell, FolderKanban, HelpCircle, LayoutDashboard, Lightbulb, MessageCircle, Newspaper, Plus, Rocket, Search, User, Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCopy } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

type Command = { id: string; label: string; hint?: string; href: string; icon: React.ComponentType<{ className?: string }>; keywords?: string };

/** Ctrl/Cmd+K quick switcher: jump to a page, start something new, or search people / projects. */
export function CommandPalette() {
  const router = useRouter();
  const copy = useCopy();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActive(0);
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const base: Command[] = React.useMemo(() => [
    { id: "home", label: copy("Start", "Home"), href: "/dashboard", icon: LayoutDashboard, keywords: "dashboard start home" },
    { id: "people", label: copy("Ludzie", "People"), href: "/builders", icon: Users, keywords: "builders ludzie people" },
    { id: "projects", label: copy("Projekty", "Projects"), href: "/projects", icon: FolderKanban, keywords: "projekty projects" },
    { id: "mine", label: copy("Moje projekty", "My projects"), href: "/my-projects", icon: FolderKanban, keywords: "moje my projects" },
    { id: "launches", label: copy("Premiery", "Launches"), href: "/launches", icon: Rocket, keywords: "launch premiery showcase" },
    { id: "feed", label: copy("Społeczność", "Community"), href: "/feed", icon: Newspaper, keywords: "feed community spolecznosc" },
    { id: "messages", label: copy("Wiadomości", "Messages"), href: "/messages", icon: MessageCircle, keywords: "chat messages wiadomosci" },
    { id: "notifications", label: copy("Powiadomienia", "Notifications"), href: "/notifications", icon: Bell, keywords: "notifications powiadomienia" },
    { id: "ideas", label: copy("Pomysły", "Ideas"), href: "/ideas", icon: Lightbulb, keywords: "ideas pomysly" },
    { id: "hackathons", label: copy("Hackathony", "Hackathons"), href: "/hackathons", icon: Rocket, keywords: "hackathon hackathony" },
    { id: "profile", label: copy("Mój profil i ustawienia", "My profile & settings"), href: "/profile", icon: User, keywords: "profile settings ustawienia profil" },
    { id: "help", label: copy("Pomoc", "Help"), href: "/help", icon: HelpCircle, keywords: "help pomoc" },
    { id: "new-project", label: copy("Utwórz projekt", "Create a project"), hint: copy("Akcja", "Action"), href: "/projects/new", icon: Plus, keywords: "new create dodaj projekt" },
    { id: "new-launch", label: copy("Dodaj premierę", "Add a launch"), hint: copy("Akcja", "Action"), href: "/launches/new", icon: Plus, keywords: "new launch dodaj premiere" },
  ], [copy]);

  const trimmed = query.trim();
  const commands = React.useMemo(() => {
    const needle = trimmed.toLowerCase();
    const matches = needle
      ? base.filter((command) => `${command.label} ${command.keywords ?? ""}`.toLowerCase().includes(needle))
      : base;
    if (!needle) return matches;
    const encoded = encodeURIComponent(trimmed);
    return [
      ...matches,
      { id: "search-people", label: copy(`Szukaj ludzi: „${trimmed}”`, `Search people: “${trimmed}”`), hint: copy("Wyszukiwanie", "Search"), href: `/builders?q=${encoded}`, icon: Search },
      { id: "search-projects", label: copy(`Szukaj projektów: „${trimmed}”`, `Search projects: “${trimmed}”`), hint: copy("Wyszukiwanie", "Search"), href: `/projects?q=${encoded}`, icon: Search },
    ];
  }, [base, trimmed, copy]);

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(command: Command | undefined) {
    if (!command) return;
    setOpen(false);
    router.push(command.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, commands.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); go(commands[active]); }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setQuery(""); setActive(0); } }}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 p-0" onKeyDown={onKeyDown}>
        <DialogTitle className="sr-only">{copy("Szybkie przejście", "Quick switcher")}</DialogTitle>
        <DialogDescription className="sr-only">
          {copy("Wpisz nazwę strony lub frazę do wyszukania. Strzałki wybierają, Enter otwiera.", "Type a page name or a search phrase. Arrow keys select, Enter opens.")}
        </DialogDescription>
        <div className="flex items-center gap-2 border-b border-[var(--bc-line)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--bc-faint)]" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            placeholder={copy("Dokąd chcesz przejść? Albo wyszukaj…", "Where to? Or search…")}
            aria-label={copy("Szukaj poleceń", "Search commands")}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={commands[active] ? `command-${commands[active].id}` : undefined}
            className="h-12 w-full bg-transparent pr-8 text-sm text-[var(--bc-ink)] outline-none placeholder:text-[var(--bc-faint)]"
          />
        </div>
        <div ref={listRef} id="command-palette-list" role="listbox" className="max-h-[320px] overflow-y-auto p-1.5">
          {commands.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--bc-faint)]">{copy("Brak wyników.", "No results.")}</p>
          ) : commands.map((command, index) => {
            const Icon = command.icon;
            return (
              <button
                key={command.id}
                id={`command-${command.id}`}
                data-index={index}
                role="option"
                aria-selected={index === active}
                type="button"
                onMouseMove={() => setActive(index)}
                onClick={() => go(command)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--bc-radius-sm)] px-3 py-2.5 text-left text-sm transition-colors",
                  index === active ? "bg-[var(--bc-surface-hover)] text-[var(--bc-ink)]" : "text-[var(--bc-muted)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{command.label}</span>
                {command.hint ? <span className="text-[11px] text-[var(--bc-faint)]">{command.hint}</span> : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--bc-line)] px-4 py-2 text-[11px] text-[var(--bc-faint)]">
          <span>↑↓ {copy("wybierz", "select")} · Enter {copy("otwórz", "open")} · Esc {copy("zamknij", "close")}</span>
          <kbd className="rounded border border-[var(--bc-line)] px-1.5 py-0.5">Ctrl K</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
