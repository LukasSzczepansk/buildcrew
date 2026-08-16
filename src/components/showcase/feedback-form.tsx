"use client";

import * as React from "react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitShowcaseFeedback } from "@/server/actions/showcase";

export function ShowcaseFeedbackForm({ entryId }: { entryId: string }) {
  const copy = useCopy();
  const locale = useLocale();
  const [liked, setLiked] = React.useState("");
  const [improve, setImprove] = React.useState("");
  const [wouldUse, setWouldUse] = React.useState<"YES" | "MAYBE" | "NO">("MAYBE");
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true);
    const result = await submitShowcaseFeedback(entryId, { liked, improve, wouldUse });
    setPending(false);
    if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
    toast.success(copy("Dzięki - feedback trafił do twórców.", "Thanks. Your feedback was sent to the creators."));
  }

  return <form onSubmit={submit} className="space-y-4">
    <div><Label>{copy("Co Ci się najbardziej podoba?", "What do you like most?")}</Label><Textarea className="mt-1.5" value={liked} onChange={(e) => setLiked(e.target.value)} maxLength={700} /></div>
    <div><Label>{copy("Co byś poprawił?", "What would you improve?")}</Label><Textarea className="mt-1.5" value={improve} onChange={(e) => setImprove(e.target.value)} maxLength={700} /></div>
    <div><Label>{copy("Czy używałbyś tego projektu?", "Would you use this project?")}</Label><div className="mt-2 grid grid-cols-3 gap-2">{([['YES',copy('Tak','Yes')],['MAYBE',copy('Może','Maybe')],['NO',copy('Nie','No')]] as const).map(([value,label]) => <button type="button" key={value} onClick={() => setWouldUse(value)} className={`rounded-[6px] border px-3 py-2 text-sm ${wouldUse === value ? 'border-lime-400 bg-lime-50 text-lime-700 dark:bg-lime-500/10' : 'border-neutral-200 dark:border-neutral-700'}`}>{label}</button>)}</div></div>
    <Button type="submit" disabled={pending}>{pending ? copy("Wysyłanie…", "Sending…") : copy("Wyślij feedback", "Send feedback")}</Button>
  </form>;
}
