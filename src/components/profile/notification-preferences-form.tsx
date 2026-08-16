"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
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

type LabelItem = [keyof Prefs, string, string, string, string];
const labels: LabelItem[] = [
  ["emailMessages", "Prywatne wiadomości", "Private messages", "E-mail dopiero po około 15 minutach, jeśli rozmowa nadal jest nieprzeczytana. Treść prywatnej wiadomości nie jest umieszczana w mailu.", "Email after about 15 minutes if the conversation is still unread. Private message content is never included in the email."],
  ["emailWorkspace", "Ważne rzeczy w workspace", "Important workspace activity", "Odpowiedzi, oznaczenia @ i przypisane zadania. Te sygnały mogą przyjść szybciej, bo wymagają konkretnej reakcji.", "Replies, @mentions and assigned tasks. These may arrive sooner because they usually need your attention."],
  ["emailProjectApplications", "Zaproszenia i zgłoszenia do projektów", "Project invitations and applications", "Ktoś chce dołączyć do projektu albo zaprasza Cię do swojej ekipy.", "Someone wants to join your project or invites you to their team."],
  ["emailProjectAccepted", "Decyzje dotyczące zgłoszeń", "Application decisions", "Akceptacja lub odrzucenie Twojego zgłoszenia do projektu.", "Acceptance or rejection of your project application."],
  ["emailMatches", "Nowe mocne dopasowania", "New strong matches", "Najlepiej dopasowani builderzy i projekty. Maksymalnie jeden taki mail na kilka dni.", "Highly relevant builders and projects. At most one such email every few days."],
  ["emailWeeklyDigest", "Tygodniowe podsumowanie", "Weekly digest", "Krótki digest: najlepsi ludzie, projekty i nieprzeczytane wiadomości.", "A short digest with relevant people, projects and unread messages."],
  ["emailBuildPool", "Build Pool", "Build Pool", "Ktoś chce zbudować coś razem z Tobą.", "Someone wants to build something with you."],
  ["emailCrew", "Crew", "Crew", "Zaproszenia i ważne zmiany w ekipach.", "Invitations and important team changes."],
  ["emailChallenge", "Hackathony i Build Challenges", "Hackathons and Build Challenges", "Zaproszenia do teamu, ważne zmiany wydarzeń i challenge.", "Team invitations and important event or challenge updates."],
  ["emailShowcaseFeedback", "Feedback do Showcase", "Showcase feedback", "Opcjonalny mail o nowym konstruktywnym feedbacku.", "Optional email when you receive new constructive feedback."],
];

export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const copy = useCopy();
  const locale = useLocale();
  const [prefs, setPrefs] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const result = await saveNotificationPreferences(prefs);
    setPending(false);
    if (result?.error) toast.error(appMessage(result.error, locale));
    else toast.success(copy("Ustawienia powiadomień zapisane.", "Notification preferences saved."));
  }

  return (
    <section className="border-t border-[var(--bc-line)] pt-5">
      <div className="max-w-[720px]">
        <h2 className="text-[16px] font-semibold">{copy("Powiadomienia e-mail", "Email notifications")}</h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{copy("Wysyłamy tylko wiadomości związane z realną aktywnością na koncie. Możesz wyłączyć dowolną kategorię.", "We only send emails tied to meaningful account activity. You can disable any category.")}</p>
      </div>

      <div className="mt-4 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
        {labels.map(([key, titlePl, titleEn, descPl, descEn]) => (
          <label key={key} className="flex cursor-pointer items-start justify-between gap-5 py-3.5">
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--bc-ink)]">{copy(titlePl, titleEn)}</span>
              <span className="mt-0.5 block max-w-[680px] text-[12px] leading-5 text-[var(--bc-faint)]">{copy(descPl, descEn)}</span>
            </span>
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]" checked={prefs[key]} onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })} />
          </label>
        ))}
      </div>

      <Button size="sm" className="mt-4" onClick={save} disabled={pending}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz ustawienia", "Save settings")}</Button>
    </section>
  );
}
