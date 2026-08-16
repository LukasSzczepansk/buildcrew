"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { createSuggestedHackathonTeam, inviteToHackathonTeam, leaveHackathonTeam, pauseHackathonMatching, requestToJoinHackathonTeam, respondHackathonTeamInvite, respondHackathonTeamRequest } from "@/server/actions/hackathons";

export function SuggestedTeamButton({ hackathonId }: { hackathonId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await createSuggestedHackathonTeam(hackathonId); setPending(false); if (result?.error) { toast.error(appMessage(result.error, locale)); return; } const invited = result && "invited" in result && typeof result.invited === "number" ? result.invited : 0; toast.success(copy(`Team created. ${invited} invitation${invited === 1 ? "" : "s"} sent.`, `Team created. ${invited} invitation${invited === 1 ? "" : "s"} sent.`)); }
  return <Button onClick={run} disabled={pending}>{pending ? copy("Matching…", "Matching…") : copy("Suggest a team", "Suggest a team")}</Button>;
}

export function InviteHackathonParticipantButton({ teamId, inviteeId }: { teamId: string; inviteeId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await inviteToHackathonTeam({ teamId, inviteeId, message: copy("Would you like to join our team for this hackathon?", "Would you like to join our team for this hackathon?") }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Invitation sent.", "Invitation sent.")); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending}>{pending ? copy("Sending…", "Sending…") : copy("Invite to team", "Invite to team")}</Button>;
}

export function RequestToJoinTeamButton({ teamId, disabled = false, alreadyRequested = false }: { teamId: string; disabled?: boolean; alreadyRequested?: boolean }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { setPending(true); const result = await requestToJoinHackathonTeam({ teamId, message: copy("I'd be happy to join your team for this hackathon.", "I'd be happy to join your team for this hackathon.") }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Join request sent.", "Join request sent.")); }
  return <Button size="sm" variant="outline" onClick={run} disabled={pending || disabled || alreadyRequested}>{alreadyRequested ? copy("Request sent", "Request sent") : pending ? copy("Sending…", "Sending…") : copy("Request to join", "Request to join")}</Button>;
}

export function HackathonInviteDecision({ inviteId }: { inviteId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamInvite({ id: inviteId, decision }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(decision === "ACCEPTED" ? copy("You joined the team.", "You joined the team.") : copy("Invitation declined.", "Invitation declined.")); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>{copy("Join", "Join")}</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>{copy("Decline", "Decline")}</Button></div>;
}

export function HackathonRequestDecision({ requestId }: { requestId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function decide(decision: "ACCEPTED" | "REJECTED") { setPending(true); const result = await respondHackathonTeamRequest({ id: requestId, decision }); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(decision === "ACCEPTED" ? copy("This person joined the team.", "This person joined the team.") : copy("Request declined.", "Request declined.")); }
  return <div className="flex gap-2"><Button size="sm" onClick={() => decide("ACCEPTED")} disabled={pending}>{copy("Accept", "Accept")}</Button><Button size="sm" variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>{copy("Decline", "Decline")}</Button></div>;
}

export function PauseHackathonMatchingButton({ hackathonId }: { hackathonId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { if (!window.confirm(copy("Pause your visibility in the team-finder pool? You can return later by saving your preferences again.", "Pause your visibility in the team-finder pool? You can return later by saving your preferences again."))) return; setPending(true); const result = await pauseHackathonMatching(hackathonId); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Team search paused.", "Team search paused.")); }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>{pending ? copy("Saving…", "Saving…") : copy("Pause search", "Pause search")}</Button>;
}

export function LeaveHackathonTeamButton({ teamId }: { teamId: string }) {
  const copy = useCopy(); const locale = useLocale(); const [pending, setPending] = React.useState(false);
  async function run() { if (!window.confirm(copy("Leave this team?", "Leave this team?"))) return; setPending(true); const result = await leaveHackathonTeam(teamId); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("You left the team.", "You left the team.")); }
  return <Button size="sm" variant="ghost" onClick={run} disabled={pending}>{copy("Leave team", "Leave team")}</Button>;
}
