"use client";

import * as React from "react";
import Link from "next/link";
import { Check, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { cancelFriendRequest, removeFriend, respondToFriendRequest, sendFriendRequest } from "@/server/actions/friends";

export type FriendRelationState =
  | { kind: "NONE" }
  | { kind: "OUTGOING"; requestId: string }
  | { kind: "INCOMING"; requestId: string }
  | { kind: "FRIENDS"; conversationId: string | null };

export function FriendRelationActions({ targetUserId, state, compact = false }: { targetUserId: string; state: FriendRelationState; compact?: boolean }) {
  const copy = useCopy();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  async function run(action: () => Promise<{ error?: string; success?: boolean }>, success: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(success);
  }

  if (state.kind === "NONE") return <Button size={compact ? "sm" : "default"} className="gap-2" disabled={pending} onClick={() => run(() => sendFriendRequest(targetUserId), copy("Zaproszenie wysłane.", "Connection request sent."))}><UserPlus className="h-4 w-4" /> {copy("Dodaj do kontaktów", "Connect")}</Button>;
  if (state.kind === "OUTGOING") return <Button size={compact ? "sm" : "default"} variant="outline" disabled={pending} onClick={() => run(() => cancelFriendRequest(state.requestId), copy("Zaproszenie anulowane.", "Request cancelled."))}>{copy("Anuluj zaproszenie", "Cancel request")}</Button>;
  if (state.kind === "INCOMING") return <div className="flex flex-wrap gap-2"><Button size={compact ? "sm" : "default"} className="gap-2" disabled={pending} onClick={() => run(() => respondToFriendRequest(state.requestId, "ACCEPTED"), copy("Kontakt dodany.", "Connection added."))}><Check className="h-4 w-4" /> {copy("Akceptuj", "Accept")}</Button><Button size={compact ? "sm" : "default"} variant="outline" className="gap-2" disabled={pending} onClick={() => run(() => respondToFriendRequest(state.requestId, "REJECTED"), copy("Zaproszenie odrzucone.", "Request declined."))}><X className="h-4 w-4" /> {copy("Odrzuć", "Decline")}</Button></div>;

  return (
    <div className="flex flex-wrap gap-2">
      {state.conversationId ? <Button asChild size={compact ? "sm" : "default"} className="gap-2"><Link href={`/messages/${state.conversationId}`}><MessageCircle className="h-4 w-4" /> {copy("Wiadomość", "Message")}</Link></Button> : null}
      <Button size={compact ? "sm" : "default"} variant="outline" className="gap-2" disabled={pending} onClick={() => { if (!window.confirm(copy("Usunąć tę osobę z kontaktów? Historia czatu zostanie usunięta.", "Remove this person from your connections? The chat history will be deleted."))) return; void run(() => removeFriend(targetUserId), copy("Usunięto z kontaktów.", "Connection removed.")); }}><UserMinus className="h-4 w-4" /> {copy("Usuń", "Remove")}</Button>
    </div>
  );
}
