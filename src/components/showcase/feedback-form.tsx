"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitShowcaseFeedback } from "@/server/actions/showcase";

export function ShowcaseFeedbackForm({ entryId }: { entryId: string }) {
  const [liked, setLiked] = React.useState("");
  const [improve, setImprove] = React.useState("");
  const [wouldUse, setWouldUse] = React.useState<"YES" | "MAYBE" | "NO">("MAYBE");
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true);
    const result = await submitShowcaseFeedback(entryId, { liked, improve, wouldUse });
    setPending(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success("Dzięki — feedback trafił do twórców.");
  }

  return <form onSubmit={submit} className="space-y-4">
    <div><Label>Co Ci się najbardziej podoba?</Label><Textarea className="mt-1.5" value={liked} onChange={(e) => setLiked(e.target.value)} maxLength={700} /></div>
    <div><Label>Co byś poprawił?</Label><Textarea className="mt-1.5" value={improve} onChange={(e) => setImprove(e.target.value)} maxLength={700} /></div>
    <div><Label>Czy używałbyś tego projektu?</Label><div className="mt-2 grid grid-cols-3 gap-2">{([['YES','Tak'],['MAYBE','Może'],['NO','Nie']] as const).map(([value,label]) => <button type="button" key={value} onClick={() => setWouldUse(value)} className={`rounded-xl border px-3 py-2 text-sm ${wouldUse === value ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/10' : 'border-neutral-200 dark:border-neutral-700'}`}>{label}</button>)}</div></div>
    <Button type="submit" disabled={pending}>{pending ? "Wysyłanie…" : "Wyślij feedback"}</Button>
  </form>;
}
