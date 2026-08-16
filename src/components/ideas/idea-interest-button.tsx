"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleIdeaInterest } from "@/server/actions/ideas";

export function IdeaInterestButton({ ideaId, initialInterested = false, compact = false }: { ideaId: string; initialInterested?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [interested, setInterested] = React.useState(initialInterested);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const result = await toggleIdeaInterest(ideaId).catch(() => ({ error: "Could not save your interest." }));
    setPending(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ("interested" in result) setInterested(Boolean(result.interested));
    router.refresh();
  }

  return <Button type="button" size={compact ? "sm" : "default"} variant={interested ? "outline" : "secondary"} onClick={toggle} disabled={pending}>{pending ? "Saving…" : interested ? "Interested ✓" : "I'm interested"}</Button>;
}
