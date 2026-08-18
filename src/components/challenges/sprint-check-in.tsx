"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitSprintCheckIn } from "@/server/actions/challenges";
import type { SprintCheckInHealth } from "@/db/schema";

const OPTIONS: { value: SprintCheckInHealth; emoji: string; label: string; text: string }[] = [
  { value: "GREEN", emoji: "🟢", label: "Dobrze", text: "Crew działa i dowozimy progres." },
  { value: "YELLOW", emoji: "🟡", label: "Mamy problem", text: "Coś nas blokuje, ale jeszcze działamy." },
  { value: "RED", emoji: "🔴", label: "Potrzebujemy pomocy", text: "Crew stoi albo potrzebuje interwencji." },
];

export function SprintCheckIn({ challengeId, latest }: { challengeId: string; latest: { health: SprintCheckInHealth; note: string | null; weekKey: string } | null }) {
  const [health, setHealth] = React.useState<SprintCheckInHealth>(latest?.health ?? "GREEN");
  const [note, setNote] = React.useState(latest?.note ?? "");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const result = await submitSprintCheckIn({ challengeId, health, note });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Check-in zapisany.");
  }

  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Weekly check-in</p>
      <h2 className="mt-2 text-lg font-semibold">Jak idzie Waszej Crew?</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-500">Krótki sygnał raz w tygodniu pomaga szybko wyłapać zespoły, które utknęły.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button key={option.value} type="button" onClick={() => setHealth(option.value)} className={`rounded-[8px] border p-3 text-left transition ${health === option.value ? "border-lime-500 bg-lime-300/30 ring-2 ring-lime-400/20 dark:bg-lime-400/10" : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-700"}`}>
            <span className="text-lg">{option.emoji}</span><p className="mt-2 text-sm font-semibold">{option.label}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{option.text}</p>
          </button>
        ))}
      </div>
      <Textarea className="mt-3" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcjonalnie: co działa, co blokuje, czego potrzebujecie?" />
      <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-neutral-400">{latest ? `Ostatni check-in: ${latest.weekKey}` : "Brak check-inu w tej edycji."}</p><Button onClick={submit} disabled={pending}>{pending ? "Zapisywanie..." : "Zapisz check-in"}</Button></div>
    </Card>
  );
}
