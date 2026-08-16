"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { createHackathonTeam } from "@/server/actions/hackathons";
export function CreateHackathonTeamForm({ hackathonId, minTeamSize, maxTeamSize }: { hackathonId: string; minTeamSize: number; maxTeamSize: number }) {
  const copy = useCopy(); const locale = useLocale();
  const [open, setOpen] = React.useState(false); const [pending, setPending] = React.useState(false); const [name, setName] = React.useState(""); const [ideaTitle, setIdeaTitle] = React.useState(""); const [ideaSummary, setIdeaSummary] = React.useState(""); const [targetSize, setTargetSize] = React.useState(Math.min(4, maxTeamSize));
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); const result = await createHackathonTeam({ hackathonId, name, ideaTitle, ideaSummary, targetSize }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else { toast.success(copy("Team created.", "Team created.")); setOpen(false); } }
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>{copy("Create a team manually", "Create a team manually")}</Button>;
  return <form onSubmit={submit} className="mt-4 border-l-2 border-[var(--bc-accent)] pl-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>{copy("Team name", "Team name")}</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="ByteForge" /></div><div><Label>{copy("Team size", "Team size")}</Label><select value={targetSize} onChange={(e) => setTargetSize(Number(e.target.value))} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, i) => minTeamSize + i).map((size) => <option value={size} key={size}>{size} {copy(size === 1 ? "person" : "people", size === 1 ? "person" : "people")}</option>)}</select></div><div className="sm:col-span-2"><Label>{copy("Idea / direction (optional)", "Idea / direction (optional)")}</Label><Input className="mt-1.5" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder={copy("Idea name", "Idea name")} /><Textarea className="mt-2 min-h-16" value={ideaSummary} onChange={(e) => setIdeaSummary(e.target.value)} placeholder={copy("What do you want to build?", "What do you want to build?")} /></div></div><div className="mt-3 flex gap-2"><Button type="submit" size="sm" disabled={pending}>{pending ? copy("Creating…", "Creating…") : copy("Create team", "Create team")}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{copy("Cancel", "Cancel")}</Button></div></form>;
}
