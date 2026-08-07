import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/filters/filter-bar";
import { BuildPoolCard } from "@/components/build/build-pool-card";
import { EmptyState } from "@/components/empty-state";
import { COMMITMENT_LABELS, INTEREST_OPTIONS, LEVEL_LABELS, ROLE_LABELS, SKILL_GROUPS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { getMembershipCrewForUser } from "@/server/data/crews";
import { computeMatch } from "@/lib/matching";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Build Pool — BuildCrew" };

export default async function BuildPoolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const [myProfile, allBuilders, myCrewId] = await Promise.all([
    getProfileByUserId(user.id),
    listBuilderProfiles(user.id),
    getMembershipCrewForUser(user.id),
  ]);
  if (!myProfile) redirect("/onboarding");

  let pool = allBuilders.filter((b) => b.onboardingCompleted && b.lookingFor.includes("OPEN_TO_BUILD"));

  if (params.role) pool = pool.filter((b) => b.role === params.role);
  if (params.skill) pool = pool.filter((b) => b.skills.includes(params.skill!));
  if (params.level) pool = pool.filter((b) => b.level === params.level);
  if (params.interest) pool = pool.filter((b) => b.interests.includes(params.interest!));

  const ranked = pool
    .map((b) => {
      const match = computeMatch(
        {
          userId: myProfile.userId,
          username: myProfile.username,
          role: myProfile.role as RoleType | null,
          level: myProfile.level as Level | null,
          weeklyHours: myProfile.weeklyHours as Commitment | null,
          interests: myProfile.interests,
          goals: myProfile.goals as Goal[],
        },
        {
          userId: b.userId,
          username: b.username,
          role: b.role as RoleType | null,
          level: b.level as Level | null,
          weeklyHours: b.weeklyHours as Commitment | null,
          interests: b.interests,
          goals: b.goals as Goal[],
        },
      );
      return { ...b, ...match };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <Topbar title="Build Pool" subtitle="Nie masz jeszcze pomysłu? Znajdź ludzi, którzy również chcą coś stworzyć." />

      <FilterBar
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: "Umiejętności", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Zainteresowania", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
        ]}
      />

      {ranked.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="🔍"
          title="Nie znaleźliśmy jeszcze idealnej osoby."
          description="Spróbuj zmienić filtry."
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((p) => (
            <BuildPoolCard
              key={p.userId}
              myCrewId={myCrewId}
              person={{
                userId: p.userId,
                username: p.username,
                avatarEmoji: p.avatarEmoji,
                role: p.role as RoleType | null,
                level: p.level as Level | null,
                weeklyHours: p.weeklyHours as Commitment | null,
                skills: p.skills,
                interests: p.interests,
                goals: p.goals as Goal[],
                reasons: p.reasons,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
