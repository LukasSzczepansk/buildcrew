"use client";

import * as React from "react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAnswerHelpful } from "@/server/actions/help";

export function HelpfulButton({ answerId, questionId }: { answerId: string; questionId: string }) {
  const copy = useCopy();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await markAnswerHelpful(answerId, questionId).catch(() => ({ error: copy("Nie udało się oznaczyć odpowiedzi.", "Could not mark the answer as helpful.") }));
        setPending(false);
        if (result?.error) toast.error(appMessage(result.error, locale));
        else toast.success(copy("Oznaczono jako pomocne.", "Marked as helpful."));
      }}
      className="gap-1.5"
    >
      <CheckCircle2 className="h-3.5 w-3.5" /> {copy("Pomogło mi", "This helped me")}
    </Button>
  );
}
