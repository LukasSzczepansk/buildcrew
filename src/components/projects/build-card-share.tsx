"use client";

import * as React from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

/**
 * Shows the viewer's own "Build card" for a completed project with one-click download / LinkedIn / copy link.
 * The LinkedIn share points at the public project page with ?card=<creditId>, whose OG image is this card.
 */
export function BuildCardShare({ projectId, creditId, projectName }: { projectId: string; creditId: string; projectName: string }) {
  const copy = useCopy();
  const [copied, setCopied] = React.useState(false);
  const cardUrl = `/api/projects/${projectId}/build-card?credit=${creditId}`;

  function shareUrl() {
    return `${window.location.origin}/p/${projectId}?card=${creditId}`;
  }

  function openLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`, "_blank", "noopener,noreferrer,width=640,height=720");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      toast.success(copy("Link skopiowany.", "Link copied."));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy("Nie udało się skopiować linku.", "Could not copy the link."));
    }
  }

  return (
    <div className="rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4 sm:p-5">
      <div className="mb-3">
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--bc-ink)]">{copy("Twoja Build card", "Your Build card")}</p>
        <p className="mt-0.5 text-[13px] text-[var(--bc-muted)]">
          {copy("Pochwal się tym, co zbudowałeś. Gotowe do wrzucenia na LinkedIn.", "Show what you built. Ready to post on LinkedIn.")}
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cardUrl}
        alt={copy(`Build card: ${projectName}`, `Build card: ${projectName}`)}
        width={1200}
        height={627}
        loading="lazy"
        className="aspect-[1200/627] w-full rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface-2)] shadow-[var(--bc-shadow-sm)]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openLinkedIn} className="gap-2">
          <Share2 className="h-4 w-4" />{copy("Udostępnij na LinkedIn", "Share on LinkedIn")}
        </Button>
        <Button asChild type="button" size="sm" variant="outline" className="gap-2">
          <a href={`${cardUrl}&download=1`} download>
            <Download className="h-4 w-4" />{copy("Pobierz obraz", "Download image")}
          </a>
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={copyLink} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copy("Kopiuj link", "Copy link")}
        </Button>
      </div>
    </div>
  );
}
