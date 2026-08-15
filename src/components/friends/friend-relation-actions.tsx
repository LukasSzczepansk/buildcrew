"use client";

import * as React from "react";
import Link from "next/link";
import { Check, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelFriendRequest, removeFriend, respondToFriendRequest, sendFriendRequest } from "@/server/actions/friends";

export type FriendRelationState =
  | { kind: "NONE" }
  | { kind: "OUTGOING"; requestId: string }
  | { kind: "INCOMING"; requestId: string }
  | { kind: "FRIENDS"; conversationId: string | null };

export function FriendRelationActions({ targetUserId, state, compact = false }: { targetUserId: string; state: FriendRelationState; compact?: boolean }) {
  const [pending, setPending] = React.useState(false);

  async function run(action: () => Promise<{ error?: string; success?: boolean }>, success: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success(success);
  }

  if (state.kind === "NONE") {
    return (
      <Button size={compact ? "sm" : "default"} className="gap-2" disabled={pending} onClick={() => run(() => sendFriendRequest(targetUserId), "Zaproszenie wysłane.")}>
        <UserPlus className="h-4 w-4" /> Dodaj do kontaktów
      </Button>
    );
  }

  if (state.kind === "OUTGOING") {
    return (
      <Button size={compact ? "sm" : "default"} variant="outline" disabled={pending} onClick={() => run(() => cancelFriendRequest(state.requestId), "Zaproszenie anulowane.")}>
        Anuluj zaproszenie
      </Button>
    );
  }

  if (state.kind === "INCOMING") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size={compact ? "sm" : "default"} className="gap-2" disabled={pending} onClick={() => run(() => respondToFriendRequest(state.requestId, "ACCEPTED"), "Kontakt dodany.")}>
          <Check className="h-4 w-4" /> Akceptuj
        </Button>
        <Button size={compact ? "sm" : "default"} variant="outline" className="gap-2" disabled={pending} onClick={() => run(() => respondToFriendRequest(state.requestId, "REJECTED"), "Zaproszenie odrzucone.")}>
          <X className="h-4 w-4" /> Odrzuć
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {state.conversationId ? (
        <Button asChild size={compact ? "sm" : "default"} className="gap-2">
          <Link href={`/messages/${state.conversationId}`}><MessageCircle className="h-4 w-4" /> Wiadomość</Link>
        </Button>
      ) : null}
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        className="gap-2"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Usunąć tę osobę z kontaktów? Historia czatu zostanie usunięta.")) return;
          void run(() => removeFriend(targetUserId), "Usunięto z kontaktów.");
        }}
      >
        <UserMinus className="h-4 w-4" /> Usuń
      </Button>
    </div>
  );
}
