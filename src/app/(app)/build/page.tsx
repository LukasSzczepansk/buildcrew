import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/filters/filter-bar";
import { BuildPoolCard } from "@/components/build/build-pool-card";
import { BuildPoolListingManager } from "@/components/build/build-pool-listing-manager";
import { EmptyState } from "@/components/empty-state";
import { INTEREST_OPTIONS, LEVEL_LABELS, ROLE_LABELS, SKILL_GROUPS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/server/data/profiles";
import { getMembershipCrewForUser } from "@/server/data/crews";
import { getBuildPoolListingForUser, listActiveBuildPoolListings } from "@/server/data/build-pool";
import { computeMatch } from "@/lib/matching";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Build Pool — BuildCrew" };

export default async function BuildPoolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const [myProfile, listingRows, myListing, myCrewId] = await Promise.all([
    getProfileByUserId(user.id),
    listActiveBuildPoolListings(user.id),
    getBuildPoolListingForUser(user.id),
    getMembershipCrewForUser(user.id),
  ]);
  if (!myProfile) redirect("/onboarding");

  let pool = listingRows;
  if (params.role) pool = pool.filter((item) => item.role === params.role);
  if (params.skill) pool = pool.filter((item) => item.technologies.includes(params.skill!));
  if (params.level) pool = pool.filter((item) => item.level === params.level);
  if (params.interest) pool = pool.filter((item) => item.profile.interests.includes(params.interest!));

  const ranked = pool
    .map((item) => {
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
          userId: item.profile.userId,
          username: item.profile.username,
          role: item.profile.role as RoleType | null,
          level: item.profile.level as Level | null,
          weeklyHours: item.profile.weeklyHours as Commitment | null,
          interests: item.profile.interests,
          goals: item.profile.goals as Goal[],
        },
      );
      return { ...item, reasons: match.reasons, score: match.score };
    })
    .sort((a, b) => b.score - a.score);

  const technologyOptions = [...new Set([...Object.values(SKILL_GROUPS).flat(), ...listingRows.flatMap((item) => item.technologies)])]
    .sort((a, b) => a.localeCompare(b))
    .map((technology) => ({ value: technology, label: technology }));

  return (
    <div>
      <Topbar title="Build Pool" subtitle="Aktywne ogłoszenia osób, które właśnie teraz chcą coś wspólnie zbudować." />

      <Card className="mb-5 p-4 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="font-semibold text-neutral-900 dark:text-white">Builderzy</span> to katalog wszystkich profili. <span className="font-semibold text-neutral-900 dark:text-white">Build Pool</span> pokazuje tylko osoby, które świadomie wystawiły aktywne zgłoszenie i są gotowe zebrać ekipę.
      </Card>

      <BuildPoolListingManager
        listing={myListing ? {
          headline: myListing.headline,
          role: myListing.role,
          technologies: myListing.technologies,
          wantsToBuild: myListing.wantsToBuild,
          avoids: myListing.avoids,
          weeklyHours: myListing.weeklyHours,
          preferredCrewSize: myListing.preferredCrewSize,
          level: myListing.level,
          description: myListing.description,
          status: myListing.status,
        } : null}
        activeCrew={Boolean(myCrewId)}
        defaults={{
          role: myProfile.role as RoleType | null,
          level: myProfile.level as Level | null,
          weeklyHours: myProfile.weeklyHours as Commitment | null,
          skills: myProfile.skills,
        }}
      />

      <FilterBar
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: "Technologia", options: technologyOptions },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Zainteresowania", options: INTEREST_OPTIONS.map((interest) => ({ value: interest, label: interest })) },
        ]}
      />

      {ranked.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="🔍"
          title="Brak aktywnych zgłoszeń pasujących do filtrów."
          description="Wystaw własne zgłoszenie albo zmień filtry."
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((item) => (
            <BuildPoolCard
              key={item.id}
              myCrewId={myCrewId}
              person={{
                userId: item.userId,
                username: item.profile.username,
                avatarEmoji: item.profile.avatarEmoji,
                headline: item.headline,
                role: item.role,
                level: item.level,
                weeklyHours: item.weeklyHours,
                technologies: item.technologies,
                wantsToBuild: item.wantsToBuild,
                avoids: item.avoids,
                preferredCrewSize: item.preferredCrewSize,
                description: item.description,
                reasons: item.reasons,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
