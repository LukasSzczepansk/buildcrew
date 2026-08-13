import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filters/filter-bar";
import { INTEREST_OPTIONS, LEVEL_LABELS, ROLE_LABELS, SKILL_GROUPS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { computeMatch } from "@/lib/matching";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Builderzy — BuildCrew" };

export default async function BuildersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const [myProfile, allBuilders] = await Promise.all([
    getProfileByUserId(user.id),
    listBuilderProfiles(user.id),
  ]);
  if (!myProfile) redirect("/onboarding");

  let builders = allBuilders.filter((b) => b.onboardingCompleted);
  if (params.role) builders = builders.filter((b) => b.role === params.role);
  if (params.skill) builders = builders.filter((b) => b.skills.includes(params.skill!));
  if (params.level) builders = builders.filter((b) => b.level === params.level);
  if (params.interest) builders = builders.filter((b) => b.interests.includes(params.interest!));
  if (params.q) {
    const query = params.q.trim().toLowerCase();
    builders = builders.filter((b) => {
      const roleLabel = b.role ? ROLE_LABELS[b.role as RoleType] : "";
      return [b.username, roleLabel, ...b.skills, ...b.interests].some((value) => value.toLowerCase().includes(query));
    });
  }

  const ranked = builders
    .map((builder) => {
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
          userId: builder.userId,
          username: builder.username,
          role: builder.role as RoleType | null,
          level: builder.level as Level | null,
          weeklyHours: builder.weeklyHours as Commitment | null,
          interests: builder.interests,
          goals: builder.goals as Goal[],
        },
      );
      return { builder, ...match };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <Topbar title="Builderzy" subtitle="Znajdź osoby, z którymi warto rozpocząć rozmowę. Najpierw pokazujemy role, dostępność, technologie i powód dopasowania." />

      <div className="mb-5 flex max-w-[820px] items-start gap-3 border-l-2 border-[#c8f169] pl-4 text-[12px] leading-5 text-[var(--bc-muted)]">
        <p><span className="font-medium text-[var(--bc-ink)]">Jak działa match:</span> bierzemy pod uwagę rolę, zainteresowania, dostępność, cel i poziom. Procent jest wskazówką — najważniejsze powody dopasowania zobaczysz przy każdej osobie.</p>
      </div>

      <FilterBar
        showSearch
        searchPlaceholder="Szukaj po nicku, roli lub technologii"
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: "Umiejętność", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Chce budować", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
        ]}
      />

      {ranked.length === 0 ? (
        <EmptyState className="mt-6" title="Nie znaleźliśmy osób pasujących do filtrów." description="Zmień filtry albo wystaw się w Build Pool." ctaLabel="Przejdź do Build Pool" ctaHref="/build" />
      ) : (
        <section className="mt-8">
          <div className="flex items-end justify-between gap-5 pb-3">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em]">Najlepsze dopasowania</h2>
              <p className="mt-1 text-[12px] text-[var(--bc-muted)]">Najpierw pokazujemy osoby z największą liczbą wspólnych sygnałów.</p>
            </div>
            <span className="shrink-0 text-[12px] tabular-nums text-[var(--bc-faint)]">{ranked.length} {ranked.length === 1 ? "osoba" : "osób"}</span>
          </div>
          <div>
            {ranked.map(({ builder: b, score, reasons }) => (
              <BuilderCard
                key={b.userId}
                matchScore={score}
                matchReasons={reasons}
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
                  lastActiveAt: b.lastActiveAt,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
