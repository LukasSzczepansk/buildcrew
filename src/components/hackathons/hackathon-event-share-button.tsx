"use client";
import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";
export function HackathonEventShareButton({ shortPath }: { shortPath: string }) {
  const copyText = useCopy();
  const [copied, setCopied] = React.useState(false);
  async function copyLink() { await navigator.clipboard.writeText(`${window.location.origin}${shortPath}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <Button type="button" size="sm" variant="ghost" onClick={copyLink}>{copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}{copied ? copyText("Link skopiowany", "Link copied") : copyText("Skopiuj krótki link", "Copy short link")}</Button>;
}
