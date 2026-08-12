"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareProjectButton({
  projectId,
  projectName,
  compact = false,
}: {
  projectId: string;
  projectName: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = `${window.location.origin}/p/${projectId}`;
    const text = `Zobacz ${projectName} na BuildCrew — projekt szuka ludzi do wspólnego budowania.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${projectName} — BuildCrew`, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        // Browser bez Web Share i Clipboard API — użytkownik nadal może otworzyć publiczny link.
      }
    }
  }

  return (
    <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={share} className="gap-1.5">
      {copied ? <Check className="h-4 w-4" /> : navigatorShareIcon(compact)}
      {copied ? "Skopiowano" : compact ? "Udostępnij" : "Udostępnij projekt"}
    </Button>
  );
}

function navigatorShareIcon(compact: boolean) {
  return compact ? <Share2 className="h-3.5 w-3.5" /> : <Copy className="h-4 w-4" />;
}
