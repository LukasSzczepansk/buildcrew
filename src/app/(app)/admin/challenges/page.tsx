import { ChallengeManager } from "@/components/admin/challenge-manager";
import { SprintAdminDashboard } from "@/components/admin/sprint-admin-dashboard";
import { listChallenges } from "@/server/data/showcase";
import { getSprintAdminData } from "@/server/data/sprints";

export default async function AdminChallengesPage() {
  const challenges = await listChallenges();
  const active = challenges.find((challenge) => challenge.status === "OPEN" || challenge.status === "BUILDING") ?? challenges[0] ?? null;
  const overview = active ? await getSprintAdminData(active.id) : null;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">BuildCrew Sprints</h2>
        <p className="mt-1 text-sm text-neutral-500">Twórz edycje, zarządzaj zgłoszeniami, dobieraj Crew, reaguj na check-iny i wysyłaj ogłoszenia.</p>
      </div>
      <ChallengeManager challenges={challenges.map((challenge) => ({ ...challenge, startsAt: challenge.startsAt.toISOString(), endsAt: challenge.endsAt.toISOString() }))} />

      {overview ? (
        <SprintAdminDashboard
          challenge={{
            id: overview.challenge.id,
            title: overview.challenge.title,
            status: overview.challenge.status,
            startsAt: overview.challenge.startsAt.toISOString(),
            endsAt: overview.challenge.endsAt.toISOString(),
            settings: overview.challenge.settings ?? {},
          }}
          applications={overview.applications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }))}
          crews={overview.crews.map((crew) => ({ id: crew.id, members: crew.members.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })) }))}
          latestCheckIns={overview.latestCheckIns.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString() }))}
          announcements={overview.announcements.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
          counts={overview.counts}
          roleCounts={overview.roleCounts}
        />
      ) : null}
    </div>
  );
}
