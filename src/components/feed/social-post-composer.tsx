"use client";

import * as React from "react";
import { FlagTriangleRight, FolderSearch, Handshake, Megaphone, Plus, Rocket, UserRoundSearch, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy } from "@/components/i18n/locale-provider";
import type { SocialPostKind } from "@/db/schema";
import { createSocialPost } from "@/server/actions/social-posts";

const PROJECT_KINDS = new Set<SocialPostKind>(["UPDATE", "LOOKING_FOR_PEOPLE", "MILESTONE", "LAUNCH"]);

export function SocialPostComposer({
  projects,
  viewer,
}: {
  projects: { id: string; name: string; isOwner: boolean }[];
  viewer: { username: string; avatarEmoji?: string | null };
}) {
  const copy = useCopy();
  const [expanded, setExpanded] = React.useState(false);
  const [kind, setKind] = React.useState<SocialPostKind>(projects.length ? "UPDATE" : "LOOKING_FOR_PROJECT");
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const needsProject = PROJECT_KINDS.has(kind);
  const selectableProjects = React.useMemo(
    () => kind === "LOOKING_FOR_PEOPLE" ? projects.filter((project) => project.isOwner) : projects,
    [kind, projects],
  );

  React.useEffect(() => {
    if (!needsProject) return;
    if (!selectableProjects.some((project) => project.id === projectId)) setProjectId(selectableProjects[0]?.id ?? "");
  }, [needsProject, projectId, selectableProjects]);

  const options: { kind: SocialPostKind; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { kind: "LOOKING_FOR_PEOPLE", label: copy("Szukam ludzi", "Looking for people"), shortLabel: copy("Szukam ludzi", "People"), icon: <UserRoundSearch className="h-3.5 w-3.5" /> },
    { kind: "LOOKING_FOR_PROJECT", label: copy("Szukam projektu", "Looking for a project"), shortLabel: copy("Szukam projektu", "Project"), icon: <FolderSearch className="h-3.5 w-3.5" /> },
    { kind: "MILESTONE", label: copy("Kamień milowy", "Milestone"), shortLabel: copy("Milestone", "Milestone"), icon: <FlagTriangleRight className="h-3.5 w-3.5" /> },
    { kind: "LAUNCH", label: copy("Premiera", "Launch"), shortLabel: copy("Launch", "Launch"), icon: <Rocket className="h-3.5 w-3.5" /> },
    { kind: "OPEN_TO_BUILDING", label: copy("Otwarty na współpracę", "Open to building"), shortLabel: copy("Open to building", "Open to building"), icon: <Handshake className="h-3.5 w-3.5" /> },
  ];

  function choose(nextKind: SocialPostKind) {
    setKind(nextKind);
    setExpanded(true);
  }

  function submit() {
    startTransition(async () => {
      const result = await createSocialPost({ kind, body, projectId: needsProject ? projectId : undefined });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(copy("Post opublikowany.", "Post published."));
      setBody("");
      setExpanded(false);
      window.location.reload();
    });
  }

  const placeholder = (() => {
    switch (kind) {
      case "LOOKING_FOR_PEOPLE": return copy("Napisz kogo szukacie i nad czym ta osoba będzie pracować.", "Say who you need and what this person would work on.");
      case "LOOKING_FOR_PROJECT": return copy("Napisz co potrafisz, ile masz czasu i jakiego projektu szukasz.", "Say what you can do, how much time you have and what kind of project you want to join.");
      case "MILESTONE": return copy("Co konkretnie udało się osiągnąć? MVP, pierwsi użytkownicy, pierwsza płatność…", "What did you actually achieve? MVP, first users, first payment…");
      case "LAUNCH": return copy("Co właśnie wypuściliście i gdzie można to zobaczyć?", "What did you just launch and where can people see it?");
      case "OPEN_TO_BUILDING": return copy("Powiedz nad czym chcesz pracować, co umiesz i ile czasu możesz poświęcić.", "Say what you want to build, what you can do and how much time you can commit.");
      default: return copy("Co zmieniło się w projekcie? Napisz krótko i konkretnie.", "What changed in the project? Keep it short and concrete.");
    }
  })();

  return (
    <section className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)]">
      <button
        type="button"
        onClick={() => { setKind(projects.length ? "UPDATE" : "LOOKING_FOR_PROJECT"); setExpanded(true); }}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-5 sm:py-4"
      >
        <Avatar username={viewer.username} seed={viewer.avatarEmoji || viewer.username} size="sm" className="h-9 w-9 shrink-0 text-[12px] sm:h-10 sm:w-10" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--bc-muted)] sm:text-[14px]">{copy("Co budujesz? Podziel się aktualizacją…", "What are you building? Share an update…")}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--bc-line)] text-[var(--bc-faint)] sm:hidden"><Plus className="h-4 w-4" /></span>
      </button>

      <div className="border-t border-[var(--bc-line)] px-2 py-2 sm:px-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((option) => {
            const disabled = PROJECT_KINDS.has(option.kind) && (option.kind === "LOOKING_FOR_PEOPLE" ? !projects.some((project) => project.isOwner) : projects.length === 0);
            return (
              <button
                key={option.kind}
                type="button"
                disabled={disabled}
                onClick={() => choose(option.kind)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border border-transparent px-2.5 text-[11px] font-medium text-[var(--bc-muted)] transition-colors hover:border-[var(--bc-line)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)] disabled:cursor-not-allowed disabled:opacity-35 sm:text-[12px]"
              >
                {option.icon}<span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[var(--bc-line)] px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--bc-accent)_15%,transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-accent-strong)]">
                {kind === "UPDATE" ? copy("Aktualizacja", "Update") : options.find((option) => option.kind === kind)?.label}
              </span>
            </div>
            <button type="button" onClick={() => setExpanded(false)} className="grid h-8 w-8 place-items-center rounded-full text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]" aria-label={copy("Zamknij", "Close")}><X className="h-4 w-4" /></button>
          </div>

          {needsProject ? (
            <div className="mt-3 max-w-sm">
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--bc-muted)]">{copy("Projekt", "Project")}</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder={copy("Wybierz projekt", "Choose a project")} /></SelectTrigger>
                <SelectContent>{selectableProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}

          <Textarea className="mt-3 min-h-[104px] resize-none" value={body} maxLength={800} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} autoFocus />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-[var(--bc-faint)]">{body.length}/800</span>
            <div className="flex items-center gap-2">
              {kind !== "UPDATE" && projects.length ? <Button type="button" size="sm" variant="ghost" onClick={() => setKind("UPDATE")}><Megaphone className="h-3.5 w-3.5" />{copy("Zwykły update", "Regular update")}</Button> : null}
              <Button size="sm" onClick={submit} disabled={pending || body.trim().length < 20 || (needsProject && !projectId)}>{pending ? copy("Publikowanie…", "Publishing…") : copy("Opublikuj", "Publish")}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
