import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filters/filter-bar";
import { COMMITMENT_LABELS, INTEREST_OPTIONS, LEVEL_LABELS, ROLE_LABELS, SKILL_GROUPS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { listBuilderProfiles } from "@/server/data/profiles";
import type { Commitment, Level, RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Builderzy — BuildCrew" };

export default async function BuildersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  let builders = await listBuilderProfiles(user.id);
  builders = builders.filter((b) => b.onboardingCompleted);

  if (params.role) builders = builders.filter((b) => b.role === params.role);
  if (params.skill) builders = builders.filter((b) => b.skills.includes(params.skill!));
  if (params.level) builders = builders.filter((b) => b.level === params.level);
  if (params.interest) builders = builders.filter((b) => b.interests.includes(params.interest!));

  return (
    <div>
      <Topbar title="Builderzy" subtitle="Ludzie otwarci na współpracę przy projektach." />

      <FilterBar
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: "Umiejętności", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Zainteresowania", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
        ]}
      />

      {builders.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="🧑‍💻"
          title="Nie znaleźliśmy nikogo pasującego do tych filtrów."
          description="Spróbuj zmienić filtry albo zajrzyj do Build Pool."
          ctaLabel="Przejdź do Build Pool"
          ctaHref="/build"
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {builders.map((b) => (
            <BuilderCard
              key={b.userId}
              builder={{
                userId: b.userId,
                username: b.username,
                avatarEmoji: b.avatarEmoji,
                role: b.role as RoleType | null,
                level: b.level as Level | null,
                weeklyHours: b.weeklyHours as Commitment | null,
                skills: b.skills,
                interests: b.interests,
                lookingFor: b.lookingFor,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
