"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createSuggestedHackathonTeam,
  inviteToHackathonTeam,
  leaveHackathonTeam,
  pauseHackathonMatching,
  requestToJoinHackathonTeam,
  respondHackathonTeamInvite,
  respondHackathonTeamRequest,
} from "@/server/actions/hackathons";

export function SuggestedTeamButton({ hackathonId }: { hackathonId: string }) {
  const [pending, setPending] = React.useState(false);
  async function run() {
    setPending(true);
    const result = await createSuggestedHackathonTeam(hackathonId);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    const invited = result && "invited" in result && typeof result.invited === "number" ? result.invited : 0;
    toast.success(`Team utworzony. Wysłano ${invited} zaproszeń.`);
  }
  return <Button onClick={run} disabled={pending}>{pending ? "Dobieranie…" : "Dobierz mi ekipę"}</Button>;
}

export function InviteHackathonParticipantButton({ teamId, inviteeId }: { teamId: string; inviteeId: string }) {
  const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await inviteToHackathonTeam({ teamId, inviteeId, message: "Chcesz dołączyć do naszego teamu na ten hackathon?" }); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Zaproszenie wysłane."); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending}>{pending ? "Wysyłanie…" : "Zaproś do teamu"}</Button>;
}

export function RequestToJoinTeamButton({ teamId, disabled = false, alreadyRequested = false }: { teamId: string; disabled?: boolean; alreadyRequested?: boolean }) {
  const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await requestToJoinHackathonTeam({ teamId, message: "Chętnie dołączę do Waszego składu na ten hackathon." }); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Prośba o dołączenie wysłana."); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending || disabled || alreadyRequested}>{alreadyRequested ? "Prośba wysłana" : pending ? "Wysyłanie…" : "Poproś o dołączenie"}</Button>;
}

export function HackathonInviteDecision({ inviteId }: { inviteId: string }) {
  const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamInvite({ id: inviteId, decision }); setPending(false); if (result?.error) toast.error(result.error); else toast.success(decision === "ACCEPTED" ? "Dołączono do teamu." : "Zaproszenie odrzucone."); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>Dołącz</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>Odrzuć</Button></div>;
}

export function HackathonRequestDecision({ requestId }: { requestId: string }) {
  const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamRequest({ id: requestId, decision }); setPending(false); if (result?.error) toast.error(result.error); else toast.success(decision === "ACCEPTED" ? "Osoba dołączyła do teamu." : "Zgłoszenie odrzucone."); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>Akceptuj</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>Odrzuć</Button></div>;
}

export function PauseHackathonMatchingButton({ hackathonId }: { hackathonId: string }) {
  const [pending, setPending] = React.useState(false);
  async function run() {
    if (!window.confirm("Wstrzymać widoczność w puli szukających teamu? Możesz wrócić później, zapisując preferencje ponownie.")) return;
    setPending(true);
    const result = await pauseHackathonMatching(hackathonId);
    setPending(false);
    if (result?.error) toast.error(result.error); else toast.success("Szukanie teamu wstrzymane.");
  }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>{pending ? "Zapisywanie…" : "Wstrzymaj szukanie"}</Button>;
}

export function LeaveHackathonTeamButton({ teamId }: { teamId: string }) {
  const [pending, setPending] = React.useState(false);
  async function run() { if (!window.confirm("Opuścić ten team?")) return; setPending(true); const result = await leaveHackathonTeam(teamId); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Opuściłeś team."); }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>Opuść team</Button>;
}
