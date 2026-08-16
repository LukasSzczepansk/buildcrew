"use client";
import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";
export function HackathonTeamShareButton({ eventName, teamName, sharePath, missingRoles }: { eventName: string; teamName: string; sharePath: string; missingRoles: string[] }) {
  const copy = useCopy();
  const [copied, setCopied] = React.useState(false);
  async function share() {
    const url = `${window.location.origin}${sharePath}`;
    const missing = missingRoles.length ? copy(` Szukamy: ${missingRoles.join(" / ")}.`, ` Looking for: ${missingRoles.join(" / ")}.`) : "";
    const text = copy(`${teamName} kompletuje skład na ${eventName}.${missing}`, `${teamName} is building a team for ${eventName}.${missing}`);
    if (navigator.share) { try { await navigator.share({ title: `${teamName} - ${eventName}`, text, url }); return; } catch {} }
    await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  return <Button type="button" size="sm" variant="outline" onClick={share}>{copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}{copied ? copy("Skopiowano", "Copied") : copy("Udostępnij team", "Share team")}</Button>;
}
