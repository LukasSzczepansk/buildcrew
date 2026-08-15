"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INTEREST_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createIdea } from "@/server/actions/ideas";

export function IdeaComposer() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [interests, setInterests] = React.useState<string[]>([]);

  function toggleInterest(value: string) {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length >= 5 ? current : [...current, value]);
  }

  async function submit() {
    setPending(true);
    const result = await createIdea({ name, summary, interests }).catch(() => ({ error: "Nie udało się zapisać pomysłu." }));
    setPending(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ("ideaId" in result && result.ideaId) {
      toast.success("Pomysł jest opublikowany.");
      router.push(`/ideas/${result.ideaId}`);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <section id="dodaj-pomysl" className="relative overflow-hidden border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <span className="absolute inset-y-0 left-0 w-[4px] bg-[var(--bc-accent)]" aria-hidden="true" />
        <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-[720px] pl-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Najprostszy start</p>
            <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.025em]">Masz kierunek? Nie musisz mieć jeszcze pełnego projektu.</h2>
            <p className="mt-2 max-w-[660px] text-sm leading-5 text-[var(--bc-muted)]">Nazwa, dwa zdania i obszary wystarczą. Inni mogą zaznaczyć zainteresowanie, a Ty później rozwiniesz wpis w pełny projekt.</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[var(--bc-faint)]">
              <span><strong className="font-medium text-[var(--bc-ink)]">01</strong> Opisz kierunek</span>
              <span><strong className="font-medium text-[var(--bc-ink)]">02</strong> Zobacz zainteresowanych</span>
              <span><strong className="font-medium text-[var(--bc-ink)]">03</strong> Rozwiń w projekt</span>
            </div>
          </div>
          <Button type="button" onClick={() => setOpen(true)} className="w-full sm:w-auto">Dodaj pomysł <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </section>
    );
  }

  return (
    <section id="dodaj-pomysl" className="border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-5 py-6 sm:px-6">
      <div className="max-w-[800px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Nowy kierunek</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Dodaj pomysł</h2>
            <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">Nie potrzebujesz stacku, roadmapy ani gotowej ekipy. To ma być szybki sygnał: „chcę coś takiego zbudować”.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Anuluj</Button>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <Label htmlFor="idea-name">Co chcesz zbudować?</Label>
            <Input id="idea-name" className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} placeholder="np. Narzędzie do prostszego planowania pracy freelancerów" maxLength={60} />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3"><Label htmlFor="idea-summary">Jednym–dwoma zdaniami</Label><span className="text-[12px] tabular-nums text-[var(--bc-faint)]">{summary.length}/320</span></div>
            <Textarea id="idea-summary" className="mt-1.5 min-h-24" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Jaki problem chcesz rozwiązać i dla kogo?" maxLength={320} />
          </div>
          <div>
            <Label>Obszary</Label>
            <p className="mt-1 text-[12px] text-[var(--bc-faint)]">Wybierz maksymalnie 5 - pomogą znaleźć osoby o podobnym kierunku.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const active = interests.includes(interest);
                return <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={cn("rounded-[5px] border px-2.5 py-1.5 text-[13px] transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{interest}</button>;
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--bc-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[500px] text-[12px] leading-4 text-[var(--bc-faint)]">Po publikacji wpis trafi do Pomysłów. Gdy pojawią się zainteresowani, możesz jednym kliknięciem zacząć rozwijać go w projekt.</p>
            <Button type="button" onClick={submit} disabled={pending}>{pending ? "Publikuję…" : "Opublikuj pomysł"}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
