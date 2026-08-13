"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { joinChallenge, leaveChallenge } from "@/server/actions/challenges";

export function ChallengeJoinPanel({ challengeId, participation, crews }: { challengeId: string; participation: { mode: "HAS_CREW" | "FIND_CREW"; crewId: string | null } | null; crews: { id: string; label: string }[] }) {
  const [mode, setMode] = React.useState<"HAS_CREW" | "FIND_CREW">(participation?.mode ?? "FIND_CREW");
  const [crewId, setCrewId] = React.useState(participation?.crewId ?? crews[0]?.id ?? "");
  const [pending, setPending] = React.useState(false);
  async function save() { setPending(true); const result = await joinChallenge({ challengeId, mode, crewId: mode === "HAS_CREW" ? crewId : "" }); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Jesteś zapisany do challenge!"); }
  async function leave() { setPending(true); const result = await leaveChallenge(challengeId); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Wypisano z challenge."); }
  return <Card className="p-5"><h3 className="font-semibold">Jak chcesz wystartować?</h3><p className="mt-1 text-sm text-neutral-500">Nie musisz mieć ekipy. BuildCrew pokaże Ci najlepiej dopasowanych uczestników.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button onClick={() => setMode("FIND_CREW")} className={`rounded-[6px] border p-3 text-left text-sm ${mode === "FIND_CREW" ? 'border-lime-400 bg-lime-50 dark:bg-lime-500/10' : 'border-neutral-200 dark:border-neutral-700'}`}><span className="font-semibold">Znajdź mi ekipę</span><span className="mt-1 block text-xs text-neutral-500">Dobierzemy osoby po roli, zainteresowaniach, czasie i celu.</span></button><button onClick={() => setMode("HAS_CREW")} disabled={!crews.length} className={`rounded-[6px] border p-3 text-left text-sm disabled:opacity-50 ${mode === "HAS_CREW" ? 'border-lime-400 bg-lime-50 dark:bg-lime-500/10' : 'border-neutral-200 dark:border-neutral-700'}`}><span className="font-semibold">Mam ekipę</span><span className="mt-1 block text-xs text-neutral-500">Zapisz istniejące Crew do challenge.</span></button></div>{mode === "HAS_CREW" && crews.length ? <select className="mt-3 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={crewId} onChange={(e) => setCrewId(e.target.value)}>{crews.map((crew) => <option key={crew.id} value={crew.id}>{crew.label}</option>)}</select> : null}<div className="mt-4 flex gap-2"><Button onClick={save} disabled={pending}>{participation ? "Zapisz wybór" : "Dołącz do challenge"}</Button>{participation ? <Button variant="ghost" onClick={leave} disabled={pending}>Wypisz się</Button> : null}</div></Card>;
}
