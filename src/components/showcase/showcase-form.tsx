"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SHOWCASE_CATEGORY_LABELS, SHOWCASE_STATUS_LABELS } from "@/lib/constants";
import { createShowcaseEntry } from "@/server/actions/showcase";
import type { ShowcaseCategory, ShowcaseStatus } from "@/db/schema";

export function ShowcaseForm({ projects, challenges }: { projects: { id: string; name: string }[]; challenges: { id: string; title: string }[] }) {
  const [pending, setPending] = React.useState(false);
  const [looking, setLooking] = React.useState(false);
  const [form, setForm] = React.useState({ projectId: "", challengeId: "", title: "", tagline: "", description: "", screenshotUrl: "", liveUrl: "", githubUrl: "", category: "OTHER" as ShowcaseCategory, status: "MVP" as ShowcaseStatus, lookingForText: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await createShowcaseEntry({ ...form, lookingForCollaborators: looking });
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-5 p-6">
        <div><Label>Nazwa projektu</Label><Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="FlowBoard" /></div>
        <div><Label>Krótki opis</Label><Input className="mt-1.5" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Co zbudowaliście i dla kogo?" /></div>
        <div><Label>Historia projektu</Label><Textarea className="mt-1.5 min-h-40" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Problem, rozwiązanie, czego się nauczyliście i co już działa." /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Link do screenshota</Label><Input className="mt-1.5" value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} placeholder="https://.../screen.png" /></div>
          <div><Label>Działający projekt</Label><Input className="mt-1.5" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://twojprojekt.pl" /></div>
        </div>
        <div><Label>GitHub (opcjonalnie)</Label><Input className="mt-1.5" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." /></div>
        <label className="flex items-start gap-3 rounded-[6px] border border-lime-200 bg-lime-50/60 p-4 dark:border-lime-500/20 dark:bg-lime-500/5">
          <input type="checkbox" className="mt-1" checked={looking} onChange={(e) => setLooking(e.target.checked)} />
          <span><span className="block text-sm font-semibold">Nadal szukamy współtwórców</span><span className="text-[13px] text-neutral-500">Showcase może sprowadzić kolejną osobę do rozwijania projektu.</span></span>
        </label>
        {looking ? <div><Label>Kogo / czego szukacie?</Label><Input className="mt-1.5" value={form.lookingForText} onChange={(e) => setForm({ ...form, lookingForText: e.target.value })} placeholder="Np. Mobile developera do aplikacji iOS/Android" /></div> : null}
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div><Label>Powiąż z projektem BuildCrew</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">Projekt solo / bez powiązania</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          <div><Label>Build Challenge</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.challengeId} onChange={(e) => setForm({ ...form, challengeId: e.target.value })}><option value="">Brak</option>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}</select></div>
          <div><Label>Kategoria</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ShowcaseCategory })}>{Object.entries(SHOWCASE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><Label>Status</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ShowcaseStatus })}>{Object.entries(SHOWCASE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </Card>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Publikowanie…" : "Opublikuj w Showcase"}</Button>
        <p className="text-[13px] leading-relaxed text-neutral-400">Showcase służy do pokazania działającego efektu. To może być MVP, eksperyment albo projekt solo - nie musi być gotowym startupem.</p>
      </div>
    </form>
  );
}
