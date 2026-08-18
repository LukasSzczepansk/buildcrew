import { Card } from "@/components/ui/card";
import { ChallengeManager } from "@/components/admin/challenge-manager";
import { COMMITMENT_LABELS, ROLE_LABELS } from "@/lib/constants";
import { listChallengeApplications, listChallenges } from "@/server/data/showcase";

export default async function AdminChallengesPage() {
  const challenges = await listChallenges();
  const active = challenges.find((challenge) => challenge.status === "OPEN" || challenge.status === "BUILDING") ?? challenges[0] ?? null;
  const applications = active ? await listChallengeApplications(active.id) : [];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">BuildCrew Sprints</h2>
        <p className="mt-1 text-sm text-neutral-500">Twórz kolejne edycje Sprintu, otwieraj zapisy, etap budowania i Demo Day.</p>
      </div>
      <ChallengeManager challenges={challenges.map((challenge) => ({ ...challenge, startsAt: challenge.startsAt.toISOString(), endsAt: challenge.endsAt.toISOString() }))} />

      {active ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Zgłoszenia</p>
              <h3 className="mt-1 text-lg font-semibold">{active.title}</h3>
            </div>
            <span className="text-sm text-neutral-500">{applications.length} zgłoszeń</span>
          </div>
          {applications.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {applications.map((entry) => {
                const application = entry.applicationData;
                return (
                  <Card key={entry.userId} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl dark:bg-neutral-800">{entry.avatarEmoji}</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{entry.username}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{entry.mode === "HAS_CREW" ? "Ma Crew" : "Szukaj Crew"}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-neutral-400">{new Date(entry.updatedAt).toLocaleDateString("pl-PL")}</span>
                    </div>
                    {application ? (
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3 rounded-[7px] bg-neutral-50 p-3 dark:bg-neutral-900">
                          <div><p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400">Rola</p><p className="mt-1 font-medium">{ROLE_LABELS[application.role]}</p></div>
                          <div><p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400">Dostępność</p><p className="mt-1 font-medium">{COMMITMENT_LABELS[application.weeklyHours]}</p></div>
                        </div>
                        <div><p className="text-xs text-neutral-400">Stack</p><p className="mt-1">{application.skills.join(" · ")}</p></div>
                        <div><p className="text-xs text-neutral-400">Projekt</p><p className="mt-1">{application.projectThemes.join(" · ")} · {application.seriousness}</p></div>
                        {application.ideaDescription ? <div><p className="text-xs text-neutral-400">Pomysł</p><p className="mt-1 leading-6 text-neutral-600 dark:text-neutral-300">{application.ideaDescription}</p></div> : null}
                        <div><p className="text-xs text-neutral-400">Cele Sprintu</p><p className="mt-1">{application.sprintGoals.join(" · ")}</p></div>
                      </div>
                    ) : <p className="mt-4 rounded-[7px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">Stary zapis bez formularza. Poproś użytkownika o edycję zgłoszenia.</p>}
                  </Card>
                );
              })}
            </div>
          ) : <Card className="p-5 text-sm text-neutral-500">Brak zgłoszeń do tej edycji.</Card>}
        </section>
      ) : null}
    </div>
  );
}
