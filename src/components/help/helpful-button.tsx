"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAnswerHelpful } from "@/server/actions/help";

export function HelpfulButton({ answerId, questionId }: { answerId: string; questionId: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await markAnswerHelpful(answerId, questionId).catch(() => ({ error: "Nie udało się oznaczyć odpowiedzi." }));
        setPending(false);
        if (result?.error) toast.error(result.error);
        else toast.success("Oznaczono jako pomocne.");
      }}
      className="gap-1.5"
    >
      <CheckCircle2 className="h-3.5 w-3.5" /> Pomogło mi
    </Button>
  );
}
