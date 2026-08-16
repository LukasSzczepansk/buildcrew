"use client";

import * as React from "react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAnswer } from "@/server/actions/help";

export function AnswerForm({ questionId }: { questionId: string }) {
  const copy = useCopy();
  const locale = useLocale();
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const result = await createAnswer({ questionId, body }).catch(() => ({ error: copy("Could not add the answer.", "Could not add the answer.") }));
    setPending(false);
    if (result?.error) {
      toast.error(appMessage(result.error, locale));
      return;
    }
    setBody("");
    toast.success(copy("Answer added.", "Answer added."));
  }

  return (
    <div className="grid gap-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={copy("Write something that may help the author…", "Write something that may help the author…")}
        className="min-h-28"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending || body.trim().length < 5} className="gap-2">
          <Send className="h-4 w-4" /> {pending ? copy("Sending…", "Sending…") : copy("Add answer", "Add answer")}
        </Button>
      </div>
    </div>
  );
}
