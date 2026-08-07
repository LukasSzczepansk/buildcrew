"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAnswer } from "@/server/actions/help";

export function AnswerForm({ questionId }: { questionId: string }) {
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const result = await createAnswer({ questionId, body }).catch(() => ({ error: "Nie udało się dodać odpowiedzi." }));
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setBody("");
    toast.success("Odpowiedź dodana.");
  }

  return (
    <div className="grid gap-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Napisz, co może pomóc autorowi…"
        className="min-h-28"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending || body.trim().length < 5} className="gap-2">
          <Send className="h-4 w-4" /> {pending ? "Wysyłanie…" : "Dodaj odpowiedź"}
        </Button>
      </div>
    </div>
  );
}
