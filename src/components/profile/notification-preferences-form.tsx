"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveNotificationPreferences } from "@/server/actions/notifications";

type Prefs = {
  emailProjectApplications: boolean;
  emailProjectAccepted: boolean;
  emailBuildPool: boolean;
  emailCrew: boolean;
  emailChallenge: boolean;
  emailShowcaseFeedback: boolean;
  emailMessages: boolean;
  emailWorkspace: boolean;
  emailMatches: boolean;
  emailWeeklyDigest: boolean;
};

const labels: [keyof Prefs, string, string][] = [
  ["emailMessages", "Prywatne wiadomości", "E-mail dopiero po około 15 minutach, jeśli rozmowa nadal jest nieprzeczytana. Treść prywatnej wiadomości nie jest umieszczana w mailu."],
  ["emailWorkspace", "Ważne rzeczy w workspace", "Odpowiedzi, oznaczenia @ i przypisane zadania. Te sygnały mogą przyjść szybciej, bo wymagają konkretnej reakcji."],
  ["emailProjectApplications", "Zaproszenia i zgłoszenia do projektów", "Ktoś chce dołączyć do projektu albo zaprasza Cię do swojej ekipy."],
  ["emailProjectAccepted", "Decyzje dotyczące zgłoszeń", "Akceptacja lub odrzucenie Twojego zgłoszenia do projektu."],
  ["emailMatches", "Nowe mocne dopasowania", "Najlepiej dopasowani builderzy i projekty. Maksymalnie jeden taki mail na kilka dni."],
  ["emailWeeklyDigest", "Tygodniowe podsumowanie", "Krótki digest: najlepsi ludzie, projekty i nieprzeczytane wiadomości."],
  ["emailBuildPool", "Build Pool", "Ktoś chce zbudować coś razem z Tobą."],
  ["emailCrew", "Crew", "Zaproszenia i ważne zmiany w ekipach."],
  ["emailChallenge", "Hackathony i Build Challenges", "Zaproszenia do teamu, ważne zmiany wydarzeń i challenge."],
  ["emailShowcaseFeedback", "Feedback do Showcase", "Opcjonalny mail o nowym konstruktywnym feedbacku."],
];

export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const result = await saveNotificationPreferences(prefs);
    setPending(false);
    if (result?.error) toast.error(result.error);
    else toast.success("Ustawienia powiadomień zapisane.");
  }

  return (
    <section className="border-t border-[var(--bc-line)] pt-5">
      <div className="max-w-[720px]">
        <h2 className="text-[16px] font-semibold">Powiadomienia e-mail</h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">Wysyłamy tylko wiadomości związane z realną aktywnością na koncie. Możesz wyłączyć dowolną kategorię.</p>
      </div>

      <div className="mt-4 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
        {labels.map(([key, title, description]) => (
          <label key={key} className="flex cursor-pointer items-start justify-between gap-5 py-3.5">
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--bc-ink)]">{title}</span>
              <span className="mt-0.5 block max-w-[680px] text-[12px] leading-5 text-[var(--bc-faint)]">{description}</span>
            </span>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]"
              checked={prefs[key]}
              onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })}
            />
          </label>
        ))}
      </div>

      <Button size="sm" className="mt-4" onClick={save} disabled={pending}>{pending ? "Zapisywanie…" : "Zapisz ustawienia"}</Button>
    </section>
  );
}
