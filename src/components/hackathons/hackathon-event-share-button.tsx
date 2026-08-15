"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HackathonEventShareButton({ shortPath }: { shortPath: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${shortPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Link skopiowany" : "Skopiuj krótki link"}
    </Button>
  );
}
