"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHackathonTeam } from "@/server/actions/hackathons";

export function CreateHackathonTeamForm({ hackathonId, minTeamSize, maxTeamSize }: { hackathonId: string; minTeamSize: number; maxTeamSize: number }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState("");
  const [ideaTitle, setIdeaTitle] = React.useState("");
  const [ideaSummary, setIdeaSummary] = React.useState("");
  const [targetSize, setTargetSize] = React.useState(Math.min(4, maxTeamSize));
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); const result = await createHackathonTeam({ hackathonId, name, ideaTitle, ideaSummary, targetSize }); setPending(false); if (result?.error) toast.error(result.error); else { toast.success("Team utworzony."); setOpen(false); } }
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Utwórz team ręcznie</Button>;
  return <form onSubmit={submit} className="mt-4 border-l-2 border-[var(--bc-accent)] pl-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Nazwa teamu</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="ByteForge" /></div><div><Label>Rozmiar</Label><select value={targetSize} onChange={(e) => setTargetSize(Number(e.target.value))} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, i) => minTeamSize + i).map((size) => <option value={size} key={size}>{size} osoby</option>)}</select></div><div className="sm:col-span-2"><Label>Pomysł / kierunek (opcjonalnie)</Label><Input className="mt-1.5" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="Nazwa pomysłu" /><Textarea className="mt-2 min-h-16" value={ideaSummary} onChange={(e) => setIdeaSummary(e.target.value)} placeholder="Co chcecie zbudować?" /></div></div><div className="mt-3 flex gap-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Tworzenie…" : "Utwórz team"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Anuluj</Button></div></form>;
}
