"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { createShowcaseEntry } from "@/server/actions/showcase";
import type { ShowcaseCategory, ShowcaseStatus } from "@/db/schema";

export function ShowcaseForm({ projects, challenges }: { projects: { id: string; name: string }[]; challenges: { id: string; title: string }[] }) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const [pending, setPending] = React.useState(false);
  const [looking, setLooking] = React.useState(false);
  const [form, setForm] = React.useState({ projectId: "", challengeId: "", title: "", tagline: "", description: "", screenshotUrl: "", liveUrl: "", githubUrl: "", category: "OTHER" as ShowcaseCategory, status: "MVP" as ShowcaseStatus, lookingForText: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await createShowcaseEntry({ ...form, lookingForCollaborators: looking });
    setPending(false);
    if (result?.error) toast.error(appMessage(result.error, locale));
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-5 p-6">
        <div><Label>{copy("Nazwa projektu", "Project name")}</Label><Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="FlowBoard" /></div>
        <div><Label>{copy("Krótki opis", "Short description")}</Label><Input className="mt-1.5" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder={copy("Co zbudowaliście i dla kogo?", "What did you build and who is it for?")} /></div>
        <div><Label>{copy("Historia projektu", "Project story")}</Label><Textarea className="mt-1.5 min-h-40" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={copy("Problem, rozwiązanie, czego się nauczyliście i co już działa.", "Describe the problem, solution, what you learned and what already works.")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{copy("Link do screenshota", "Screenshot URL")}</Label><Input className="mt-1.5" value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} placeholder="https://.../screen.png" /></div>
          <div><Label>{copy("Działający projekt", "Live project")}</Label><Input className="mt-1.5" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://yourproject.com" /></div>
        </div>
        <div><Label>{copy("GitHub (opcjonalnie)", "GitHub (optional)")}</Label><Input className="mt-1.5" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." /></div>
        <label className="flex items-start gap-3 rounded-[6px] border border-lime-200 bg-lime-50/60 p-4 dark:border-lime-500/20 dark:bg-lime-500/5">
          <input type="checkbox" className="mt-1" checked={looking} onChange={(e) => setLooking(e.target.checked)} />
          <span><span className="block text-sm font-semibold">{copy("Nadal szukamy współtwórców", "We are still looking for collaborators")}</span><span className="text-[13px] text-neutral-500">{copy("Showcase może sprowadzić kolejną osobę do rozwijania projektu.", "Showcase can help you meet another person to grow the project with.")}</span></span>
        </label>
        {looking ? <div><Label>{copy("Kogo / czego szukacie?", "Who or what are you looking for?")}</Label><Input className="mt-1.5" value={form.lookingForText} onChange={(e) => setForm({ ...form, lookingForText: e.target.value })} placeholder={copy("Np. Mobile developera do aplikacji iOS/Android", "e.g. a mobile developer for an iOS/Android app")} /></div> : null}
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div><Label>{copy("Powiąż z projektem BuildCrew", "Link to a BuildCrew project")}</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">{copy("Projekt solo / bez powiązania", "Solo project / no link")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          <div><Label>Build Challenge</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.challengeId} onChange={(e) => setForm({ ...form, challengeId: e.target.value })}><option value="">{copy("Brak", "None")}</option>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}</select></div>
          <div><Label>{copy("Kategoria", "Category")}</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ShowcaseCategory })}>{Object.entries(labels.showcaseCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><Label>{copy("Status", "Status")}</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ShowcaseStatus })}>{Object.entries(labels.showcaseStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </Card>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? copy("Publikowanie…", "Publishing…") : copy("Opublikuj w Showcase", "Publish to Showcase")}</Button>
        <p className="text-[13px] leading-relaxed text-neutral-400">{copy("Showcase służy do pokazania działającego efektu. To może być MVP, eksperyment albo projekt solo - nie musi być gotowym startupem.", "Showcase is for working results. It can be an MVP, experiment or solo project; it does not need to be a finished startup.")}</p>
      </div>
    </form>
  );
}
