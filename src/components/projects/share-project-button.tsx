"use client";

import Image from "next/image";
import * as React from "react";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import type { RoleType } from "@/db/schema";

type ShareRole = {
  id: string;
  roleType: RoleType;
};

type ShareMode =
  | { type: "project" }
  | { type: "role"; roleId: string };

export function ShareProjectButton({
  projectId,
  projectName,
  projectTagline,
  openRoles = [],
  compact = false,
}: {
  projectId: string;
  projectName: string;
  projectTagline?: string;
  openRoles?: ShareRole[];
  compact?: boolean;
}) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState<"link" | "text" | "discord" | null>(null);
  const [mode, setMode] = React.useState<ShareMode>({ type: "project" });

  const role = mode.type === "role" ? openRoles.find((item) => item.id === mode.roleId) : undefined;
  const roleLabel = role ? labels.roles[role.roleType] : null;

  const relativeUrl = mode.type === "role"
    ? `/p/${projectId}?share=role&role=${encodeURIComponent(mode.roleId)}`
    : `/p/${projectId}`;
  const imageUrl = mode.type === "role"
    ? `/api/projects/${projectId}/share-card?variant=recruitment&role=${encodeURIComponent(mode.roleId)}`
    : `/api/projects/${projectId}/share-card`;

  function getShareUrl() {
    return `${window.location.origin}${relativeUrl}`;
  }

  function getShareText() {
    if (roleLabel) {
      return copy(`Szukamy ${roleLabel} do projektu ${projectName}. ${projectTagline ? `${projectTagline} ` : ""}Zobacz projekt na BuildCrew.`, `We’re looking for a ${roleLabel} for ${projectName}. ${projectTagline ? `${projectTagline} ` : ""}See the project on BuildCrew.`);
    }
    return copy(`${projectName} na BuildCrew. ${projectTagline ? `${projectTagline} ` : ""}Zobacz projekt i ekipę.`, `${projectName} on BuildCrew. ${projectTagline ? `${projectTagline} ` : ""}See the project and team.`);
  }

  async function copyShare(kind: "link" | "text" | "discord") {
    const url = getShareUrl();
    const value = kind === "link" ? url : `${getShareText()}\n${url}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function openShareWindow(target: "facebook" | "linkedin" | "x") {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    const targetUrl = target === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
      : target === "linkedin"
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        : `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

    window.open(targetUrl, "_blank", "noopener,noreferrer,width=760,height=680");
  }

  async function nativeShare() {
    const url = getShareUrl();
    if (!navigator.share) {
      await copyShare("link");
      return;
    }

    try {
      await navigator.share({ title: `${projectName} - BuildCrew`, text: getShareText(), url });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") await copyShare("link");
    }
  }

  const downloadName = `${slugify(projectName)}-${mode.type === "role" && roleLabel ? slugify(roleLabel) : "project"}-buildcrew.png`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={compact ? "sm" : "default"} className="gap-1.5">
          <Share2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {compact ? copy("Udostępnij", "Share") : copy("Udostępnij projekt", "Share project")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto p-0">
        <DialogHeader className="border-b border-[var(--bc-line)] px-5 py-5 pr-12 sm:px-6">
          <DialogTitle>{copy("Udostępnij projekt", "Share project")}</DialogTitle>
          <DialogDescription>
            {copy("Publiczny link ma własną grafikę Open Graph. Facebook, LinkedIn i komunikatory pobiorą ją automatycznie.", "The public link has its own Open Graph image. Facebook, LinkedIn and messaging apps will pick it up automatically.")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-6">
          {openRoles.length > 0 ? (
            <div className="mb-5 border-b border-[var(--bc-line)] pb-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Typ udostępnienia", "Share type")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ModeButton active={mode.type === "project"} onClick={() => setMode({ type: "project" })}>
                  {copy("Cały projekt", "Whole project")}
                </ModeButton>
                {openRoles.map((item) => (
                  <ModeButton
                    key={item.id}
                    active={mode.type === "role" && mode.roleId === item.id}
                    onClick={() => setMode({ type: "role", roleId: item.id })}
                  >
                    {copy("Szukamy:", "Looking for:")} {labels.roles[item.roleType]}
                  </ModeButton>
                ))}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-canvas)]">
            <Image
              src={imageUrl}
              alt={`${copy("Podgląd grafiki udostępniania projektu", "Project share image preview")} ${projectName}`}
              width={1200}
              height={630}
              unoptimized
              className="block h-auto w-full"
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Udostępnij", "Share")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => openShareWindow("facebook")}>Facebook</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => openShareWindow("linkedin")}>LinkedIn</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => openShareWindow("x")}>X</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => copyShare("discord")}>
                  {copied === "discord" ? <Check className="h-3.5 w-3.5" /> : null}
                  {copied === "discord" ? copy("Skopiowano", "Copied") : copy("Dla Discorda", "For Discord")}
                </Button>
              </div>
              <button
                type="button"
                onClick={nativeShare}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {copy("Otwórz systemowe udostępnianie", "Open system share")}
              </button>
            </div>

            <div className="border-t border-[var(--bc-line)] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Link i grafika", "Link and image")}</p>
              <div className="mt-2 space-y-2">
                <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => copyShare("link")}>
                  {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "link" ? copy("Link skopiowany", "Link copied") : copy("Kopiuj link", "Copy link")}
                </Button>
                <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => copyShare("text")}>
                  {copied === "text" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "text" ? copy("Tekst skopiowany", "Text copied") : copy("Kopiuj tekst + link", "Copy text + link")}
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href={imageUrl} download={downloadName}>
                    <Download className="h-3.5 w-3.5" />
                    {copy("Pobierz grafikę PNG", "Download PNG image")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "border-[var(--bc-ink)] bg-[var(--bc-ink)] text-[var(--bc-surface)]"
          : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "buildcrew";
}
