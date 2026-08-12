import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filters/filter-bar";
import { Card } from "@/components/ui/card";
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
      <Topbar title="Builderzy" subtitle="Poznaj ludzi, zobacz ich intencję i sprawdź, z kim możesz dobrze się uzupełniać." />

      <Card className="mb-5 border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold">Najpierw ludzie, potem pomysł.</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Profile są domyślnie sortowane według dopasowania do Twojej roli, zainteresowań, dostępności, celu i poziomu. Procent jest wskazówką, nie oceną człowieka.</p>
          </div>
        </div>
      </Card>

      <FilterBar filters={[
        { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
        { key: "skill", label: "Umiejętności", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
        { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
        { key: "interest", label: "Co chce budować", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
      ]} />

      {ranked.length === 0 ? (
        <EmptyState className="mt-6" icon="🧑‍💻" title="Nie znaleźliśmy nikogo pasującego do tych filtrów." description="Spróbuj zmienić filtry albo wystaw się w Build Pool — wtedy inni też łatwiej Cię znajdą." ctaLabel="Przejdź do Build Pool" ctaHref="/build" />
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Najlepsze dopasowania dla Ciebie</h2>
              <p className="text-xs text-neutral-400">Na podstawie danych, które już masz w profilu.</p>
            </div>
            <span className="text-xs text-neutral-400">{ranked.length} {ranked.length === 1 ? "osoba" : "osób"}</span>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      )}
    </div>
  );
}
