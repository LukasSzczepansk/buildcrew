"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CHALLENGE_STATUS_LABELS } from "@/lib/constants";
import type { ChallengeStatus } from "@/db/schema";
import { createChallenge, setChallengeStatus } from "@/server/actions/challenges";

export function ChallengeManager({ challenges }: { challenges: { id: string; title: string; prompt: string; status: ChallengeStatus; startsAt: string; endsAt: string }[] }) {
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", prompt: "", description: "", category: "", startsAt: "", endsAt: "" });
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!form.startsAt || !form.endsAt) { toast.error("Set the start and end dates."); return; } setPending(true); const result = await createChallenge({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }); setPending(false); if (result?.error) toast.error(result.error); else { toast.success("Sprint utworzony."); setForm({ title: "", prompt: "", description: "", category: "", startsAt: "", endsAt: "" }); } }
  async function change(id: string, status: ChallengeStatus) { setPending(true); const result = await setChallengeStatus(id, status); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Status zmieniony."); }
  return <div className="grid gap-6 xl:grid-cols-[420px_1fr]"><Card className="p-5"><h2 className="font-semibold">Nowy BuildCrew Sprint</h2><form onSubmit={submit} className="mt-4 space-y-4"><div><Label>Name</Label><Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="BuildCrew Sprint #1" /></div><div><Label>Wyzwanie</Label><Input className="mt-1.5" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="W 30 dni zbudujcie i wypuśćcie działające MVP" /></div><div><Label>Description</Label><Textarea className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div><Label>Kategoria</Label><Input className="mt-1.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="EduTech" /></div><div className="grid grid-cols-2 gap-3"><div><Label>Start</Label><Input className="mt-1.5" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div><div><Label>End</Label><Input className="mt-1.5" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div></div><Button type="submit" disabled={pending} className="w-full">Utwórz Sprint</Button></form></Card><div className="space-y-3">{challenges.map((challenge) => <Card key={challenge.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{challenge.title}</p><p className="mt-1 text-sm text-neutral-500">{challenge.prompt}</p><p className="mt-2 text-[13px] text-neutral-400">{new Date(challenge.startsAt).toLocaleString("en-US")} → {new Date(challenge.endsAt).toLocaleString("en-US")}</p></div><span className="text-[13px] font-medium">{CHALLENGE_STATUS_LABELS[challenge.status]}</span></div><div className="mt-4 flex flex-wrap gap-2">{(["OPEN","BUILDING","VOTING","CLOSED"] as ChallengeStatus[]).map((status) => <Button key={status} size="sm" variant={challenge.status === status ? "default" : "outline"} onClick={() => change(challenge.id, status)} disabled={pending}>{CHALLENGE_STATUS_LABELS[status]}</Button>)}</div></Card>)}</div></div>;
}
