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
  ["emailMessages", "Private messages", "Private messages", "Email only after about 15 minutes if the conversation is still unread. The private message content is not included in the email.", "Email after about 15 minutes if the conversation is still unread. Private message content is never included in the email."],
  ["emailWorkspace", "Important workspace activity", "Important workspace activity", "Replies, @mentions, and assigned tasks. These alerts may arrive sooner because they require a specific action.", "Replies, @mentions and assigned tasks. These may arrive sooner because they usually need your attention."],
  ["emailProjectApplications", "Project invitations and applications", "Project invitations and applications", "Someone wants to join a project or is inviting you to their team.", "Someone wants to join your project or invites you to their team."],
  ["emailProjectAccepted", "Application decisions", "Application decisions", "Acceptance or rejection of your project application.", "Acceptance or rejection of your project application."],
  ["emailMatches", "New strong matches", "New strong matches", "Best-matching builders and projects. At most one email like this every few days.", "Highly relevant builders and projects. At most one such email every few days."],
  ["emailWeeklyDigest", "Weekly digest", "Weekly digest", "A short digest of top people, projects, and unread messages.", "A short digest with relevant people, projects and unread messages."],
  ["emailBuildPool", "Build Pool", "Build Pool", "Someone wants to build something with you.", "Someone wants to build something with you."],
  ["emailCrew", "Crew", "Crew", "Invitations and important team changes.", "Invitations and important team changes."],
  ["emailChallenge", "Hackathons and Build Challenges", "Hackathons and Build Challenges", "Team invitations and important event or challenge updates.", "Team invitations and important event or challenge updates."],
  ["emailShowcaseFeedback", "Showcase feedback", "Showcase feedback", "Optional email about new constructive feedback.", "Optional email when you receive new constructive feedback."],
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
    else toast.success(copy("Notification preferences saved.", "Notification preferences saved."));
  }

  return (
    <section className="border-t border-[var(--bc-line)] pt-5">
      <div className="max-w-[720px]">
        <h2 className="text-[16px] font-semibold">{copy("Email notifications", "Email notifications")}</h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{copy("We only send emails tied to meaningful account activity. You can disable any category.", "We only send emails tied to meaningful account activity. You can disable any category.")}</p>
      </div>

      <div className="mt-4 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
        {labels.map(([key, titlePl, titleEn, descPl, descEn]) => (
          <label key={key} className="flex cursor-pointer items-start justify-between gap-5 py-3.5">
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--bc-ink)]">{copy(titleEn, titleEn)}</span>
              <span className="mt-0.5 block max-w-[680px] text-[12px] leading-5 text-[var(--bc-faint)]">{copy(descEn, descEn)}</span>
            </span>
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]" checked={prefs[key]} onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })} />
          </label>
        ))}
      </div>

      <Button size="sm" className="mt-4" onClick={save} disabled={pending}>{pending ? copy("Saving…", "Saving…") : copy("Save settings", "Save settings")}</Button>
    </section>
  );
}
