"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { createSuggestedHackathonTeam, inviteToHackathonTeam, leaveHackathonTeam, pauseHackathonMatching, requestToJoinHackathonTeam, respondHackathonTeamInvite, respondHackathonTeamRequest } from "@/server/actions/hackathons";

export function SuggestedTeamButton({ hackathonId }: { hackathonId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await createSuggestedHackathonTeam(hackathonId); setPending(false); if (result?.error) { toast.error(appMessage(result.error, locale)); return; } const invited = result && "invited" in result && typeof result.invited === "number" ? result.invited : 0; toast.success(copy(`Team utworzony. Wysłano ${invited} zaproszeń.`, `Team created. ${invited} invitation${invited === 1 ? "" : "s"} sent.`)); }
  return <Button onClick={run} disabled={pending}>{pending ? copy("Dobieranie…", "Matching…") : copy("Dobierz mi ekipę", "Suggest a team")}</Button>;
}

export function InviteHackathonParticipantButton({ teamId, inviteeId }: { teamId: string; inviteeId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await inviteToHackathonTeam({ teamId, inviteeId, message: copy("Chcesz dołączyć do naszego teamu na ten hackathon?", "Would you like to join our team for this hackathon?") }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Zaproszenie wysłane.", "Invitation sent.")); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending}>{pending ? copy("Wysyłanie…", "Sending…") : copy("Zaproś do teamu", "Invite to team")}</Button>;
}

export function RequestToJoinTeamButton({ teamId, disabled = false, alreadyRequested = false }: { teamId: string; disabled?: boolean; alreadyRequested?: boolean }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await requestToJoinHackathonTeam({ teamId, message: copy("Chętnie dołączę do Waszego składu na ten hackathon.", "I'd be happy to join your team for this hackathon.") }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Prośba o dołączenie wysłana.", "Join request sent.")); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending || disabled || alreadyRequested}>{alreadyRequested ? copy("Prośba wysłana", "Request sent") : pending ? copy("Wysyłanie…", "Sending…") : copy("Poproś o dołączenie", "Request to join")}</Button>;
}

export function HackathonInviteDecision({ inviteId }: { inviteId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamInvite({ id: inviteId, decision }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(decision === "ACCEPTED" ? copy("Dołączono do teamu.", "You joined the team.") : copy("Zaproszenie odrzucone.", "Invitation declined.")); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>{copy("Dołącz", "Join")}</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>{copy("Odrzuć", "Decline")}</Button></div>;
}

export function HackathonRequestDecision({ requestId }: { requestId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamRequest({ id: requestId, decision }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(decision === "ACCEPTED" ? copy("Osoba dołączyła do teamu.", "This person joined the team.") : copy("Zgłoszenie odrzucone.", "Request declined.")); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>{copy("Akceptuj", "Accept")}</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>{copy("Odrzuć", "Decline")}</Button></div>;
}

export function PauseHackathonMatchingButton({ hackathonId }: { hackathonId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { if (!window.confirm(copy("Wstrzymać widoczność w puli szukających teamu? Możesz wrócić później, zapisując preferencje ponownie.", "Pause your visibility in the team-finder pool? You can return later by saving your preferences again."))) return; setPending(true); const result = await pauseHackathonMatching(hackathonId); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Szukanie teamu wstrzymane.", "Team search paused.")); }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Wstrzymaj szukanie", "Pause search")}</Button>;
}

export function LeaveHackathonTeamButton({ teamId }: { teamId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { if (!window.confirm(copy("Opuścić ten team?", "Leave this team?"))) return; setPending(true); const result = await leaveHackathonTeam(teamId); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Opuściłeś team.", "You left the team.")); }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>{copy("Opuść team", "Leave team")}</Button>;
}
