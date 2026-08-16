"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { respondToBuildProposal, respondToCrewInvite } from "@/server/actions/crews";
import { respondToProjectInvite } from "@/server/actions/projects";

type Props =
  | { type: "BUILD_PROPOSAL"; id: string }
  | { type: "CREW_INVITE"; id: string; crewId: string }
  | { type: "PROJECT_INVITE"; id: string; projectId: string };

export function InvitationActions(props: Props) {
  const router = useRouter();
  const copy = useCopy();
  const locale = useLocale();
  const [pending, setPending] = React.useState<"accept" | "reject" | null>(null);

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    setPending(decision === "ACCEPTED" ? "accept" : "reject");
    try {
      if (props.type === "BUILD_PROPOSAL") {
        const result = await respondToBuildProposal(props.id, decision);
        if ("error" in result && result.error) {
          toast.error(appMessage(result.error, locale));
          return;
        }
        if (decision === "ACCEPTED" && result?.crewId) {
          toast.success(copy("Ekipa utworzona!", "Team created!"));
          router.push(`/crews/${result.crewId}`);
          return;
        }
      } else if (props.type === "CREW_INVITE") {
        const result = await respondToCrewInvite(props.id, decision);
        if ("error" in result && result.error) {
          toast.error(appMessage(result.error, locale));
          return;
        }
        if (decision === "ACCEPTED") {
          toast.success(copy("Dołączyłeś do ekipy!", "You joined the team!"));
          router.push(`/crews/${props.crewId}`);
          return;
        }
      } else {
        const result = await respondToProjectInvite(props.id, decision);
        if ("error" in result && result.error) {
          toast.error(appMessage(result.error, locale));
          return;
        }
        if (decision === "ACCEPTED") {
          toast.success(copy("Dołączyłeś do projektu!", "You joined the project!"));
          router.push(`/projects/${props.projectId}`);
          return;
        }
      }
      toast.success(decision === "ACCEPTED" ? copy("Zaakceptowano.", "Accepted.") : copy("Odrzucono.", "Declined."));
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => respond("ACCEPTED")} disabled={pending !== null}>
        {pending === "accept" ? copy("Akceptowanie...", "Accepting...") : copy("Akceptuj", "Accept")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => respond("REJECTED")} disabled={pending !== null}>
        {pending === "reject" ? copy("Odrzucanie...", "Declining...") : copy("Odrzuć", "Decline")}
      </Button>
    </div>
  );
}
