"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HackathonTeamShareButton({
  eventName,
  teamName,
  sharePath,
  missingRoles,
}: {
  eventName: string;
  teamName: string;
  sharePath: string;
  missingRoles: string[];
}) {
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = `${window.location.origin}${sharePath}`;
    const missing = missingRoles.length ? ` Szukamy: ${missingRoles.join(" / ")}.` : "";
    const text = `${teamName} kompletuje skład na ${eventName}.${missing}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${teamName} — ${eventName}`, text, url });
        return;
      } catch {
        // User may cancel the native share sheet. Fall back only when sharing is unavailable.
      }
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={share}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Skopiowano" : "Udostępnij team"}
    </Button>
  );
}
