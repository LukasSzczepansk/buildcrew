"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

export function ErrorPanel({ error, reset, homeHref = "/dashboard" }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  const copy = useCopy();
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-3 px-4 py-10" role="alert">
      <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />
      <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">{copy("Coś poszło nie tak", "Something went wrong")}</h1>
      <p className="text-sm leading-5 text-[var(--bc-muted)]">
        {copy(
          "Nie udało się załadować tej strony. Spróbuj ponownie – jeśli problem wraca, daj nam znać.",
          "We could not load this page. Try again – if the problem keeps happening, let us know.",
        )}
      </p>
      {error.digest ? <p className="text-[12px] text-[var(--bc-faint)]">{copy("Kod błędu", "Error code")}: {error.digest}</p> : null}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>{copy("Spróbuj ponownie", "Try again")}</Button>
        <Button asChild variant="outline"><Link href={homeHref}>{copy("Wróć na start", "Back to start")}</Link></Button>
      </div>
    </div>
  );
}
