"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveNotificationPreferences } from "@/server/actions/notifications";

type Prefs = {
  emailProjectApplications: boolean;
  emailProjectAccepted: boolean;
  emailBuildPool: boolean;
  emailCrew: boolean;
  emailChallenge: boolean;
  emailShowcaseFeedback: boolean;
  emailMessages: boolean;
};
const labels: [keyof Prefs, string, string][] = [
  ["emailProjectApplications", "Ktoś chce dołączyć do mojego projektu", "Najważniejsze zgłoszenia do Twojej ekipy."],
  ["emailProjectAccepted", "Decyzje dotyczące projektów", "Informacja o zaakceptowaniu do ekipy."],
  ["emailBuildPool", "Odpowiedzi z Build Pool", "Ktoś chce zbudować coś razem z Tobą."],
  ["emailCrew", "Zaproszenia i zmiany w Crew", "Tworzenie i powiększanie ekip."],
  ["emailChallenge", "Build Challenge", "Start, zmiany statusu i ważne informacje."],
  ["emailShowcaseFeedback", "Feedback do Showcase", "Opcjonalny mail, gdy ktoś napisze konstruktywny feedback."],
  ["emailMessages", "Podsumowania wiadomości", "Zarezerwowane dla późniejszych maili o nieprzeczytanych rozmowach."],
];
export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = React.useState(initial); const [pending, setPending] = React.useState(false);
  async function save() { setPending(true); const result = await saveNotificationPreferences(prefs); setPending(false); if (result?.error) toast.error(result.error); else toast.success("Ustawienia powiadomień zapisane."); }
  return <Card className="p-5"><h2 className="font-semibold">Powiadomienia e-mail</h2><p className="mt-1 text-sm text-neutral-500">W aplikacji nadal zobaczysz wszystkie ważne zdarzenia. Tutaj wybierasz tylko dodatkowe e-maile.</p><div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">{labels.map(([key,title,description]) => <label key={key} className="flex items-start gap-3 py-3"><input type="checkbox" className="mt-1" checked={prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} /><span><span className="block text-sm font-medium">{title}</span><span className="text-xs text-neutral-400">{description}</span></span></label>)}</div><Button size="sm" onClick={save} disabled={pending}>{pending ? "Zapisywanie…" : "Zapisz ustawienia"}</Button></Card>;
}
