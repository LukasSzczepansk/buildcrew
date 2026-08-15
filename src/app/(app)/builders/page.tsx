import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filters/filter-bar";
import { INTEREST_OPTIONS, LEVEL_LABELS, LOOKING_FOR_LABELS, ROLE_LABELS, SKILL_GROUPS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { computeMatch } from "@/lib/matching";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { listFollowing } from "@/server/data/network";
import { FollowButton } from "@/components/network/follow-button";
import type { Commitment, Goal, Level, LookingFor, RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Builderzy — BuildCrew" };

export default async function BuildersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const [myProfile, allBuilders, following] = await Promise.all([getProfileByUserId(user.id), listBuilderProfiles(user.id), listFollowing(user.id)]);
  if (!myProfile) redirect("/onboarding");

  let builders = allBuilders.filter((b) => b.onboardingCompleted);
  if (params.role) builders = builders.filter((b) => b.role === params.role);
  if (params.skill) builders = builders.filter((b) => b.skills.includes(params.skill!));
  if (params.level) builders = builders.filter((b) => b.level === params.level);
  if (params.interest) builders = builders.filter((b) => b.interests.includes(params.interest!));
  if (params.intent) builders = builders.filter((b) => b.lookingFor.includes(params.intent as LookingFor));
  if (params.q) {
    const query = params.q.trim().toLowerCase();
    builders = builders.filter((b) => {
      const roleLabel = b.role ? ROLE_LABELS[b.role as RoleType] : "";
      return [b.username, roleLabel, ...b.skills, ...b.interests].some((value) => value.toLowerCase().includes(query));
    });
  }

  const sort = params.sort === "open" || params.sort === "active" ? params.sort : "match";
  const followingIds = new Set(following.map((item) => item.profile.userId));
  const ranked = builders
    .map((builder) => {
      const match = computeMatch(
        { userId: myProfile.userId, username: myProfile.username, role: myProfile.role as RoleType | null, level: myProfile.level as Level | null, weeklyHours: myProfile.weeklyHours as Commitment | null, interests: myProfile.interests, goals: myProfile.goals as Goal[] },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[] },
      );
      return { builder, ...match };
    })
    .sort((a, b) => {
      if (sort === "open") {
        const aOpen = a.builder.lookingFor.includes("OPEN_TO_BUILD") || a.builder.lookingFor.includes("WANTS_PROJECT") ? 1 : 0;
        const bOpen = b.builder.lookingFor.includes("OPEN_TO_BUILD") || b.builder.lookingFor.includes("WANTS_PROJECT") ? 1 : 0;
        return bOpen - aOpen || b.score - a.score;
      }
      if (sort === "active") {
        const aTime = a.builder.lastActiveAt ? new Date(a.builder.lastActiveAt).getTime() : 0;
        const bTime = b.builder.lastActiveAt ? new Date(b.builder.lastActiveAt).getTime() : 0;
        return bTime - aTime || b.score - a.score;
      }
      return b.score - a.score;
    });

  return (
    <div>
      <Topbar title="Ludzie" subtitle="Poznawaj builderów, z którymi realnie możesz coś zbudować — nie kolekcjonuj pustych kontaktów." />

      <div className="mb-5 flex gap-1 border-b border-[var(--bc-line)] text-[13px] font-medium"><Link href="/builders" className="relative px-3 py-2.5 text-[var(--bc-ink)]">Odkrywaj ludzi<span className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--bc-accent)]" /></Link><Link href="/network" className="px-3 py-2.5 text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Moja sieć</Link></div>

      <div className="mb-5 grid gap-3 border-b border-[var(--bc-line)] pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Twoja intencja</p>
          <p className="mt-1 max-w-[720px] text-sm leading-5 text-[var(--bc-muted)]">{myProfile.lookingFor.length ? myProfile.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).join(" · ") : "Uzupełnij czego szukasz, żeby poprawić rekomendacje."}</p>
        </div>
        <div className="flex flex-wrap gap-1 text-[12px] font-medium">
          <SortLink href={withSort(params, "match")} active={sort === "match"}>Najlepsze dopasowanie</SortLink>
          <SortLink href={withSort(params, "open")} active={sort === "open"}>Open to build</SortLink>
          <SortLink href={withSort(params, "active")} active={sort === "active"}>Ostatnio aktywni</SortLink>
        </div>
      </div>

      <FilterBar
        showSearch
        searchPlaceholder="Szukaj osoby, roli lub technologii"
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: "Technologia", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Obszar", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
          { key: "intent", label: "Szukam teraz", options: Object.entries(LOOKING_FOR_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
      />

      {ranked.length === 0 ? (
        <EmptyState className="mt-6" title="Brak osób pasujących do filtrów" description="Zmień filtry albo sprawdź Build Pool." ctaLabel="Build Pool" ctaHref="/build" />
      ) : (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-[18px] font-semibold tracking-[-0.015em]">Najlepsze dopasowania</h2>
            <span className="text-[13px] tabular-nums text-[var(--bc-faint)]">{ranked.length} {ranked.length === 1 ? "osoba" : "osób"}</span>
          </div>
          <div className="space-y-2.5">
            {ranked.map(({ builder: b, score, reasons }) => (
              <BuilderCard key={b.userId} matchScore={score} matchReasons={reasons} action={<FollowButton targetUserId={b.userId} initialFollowing={followingIds.has(b.userId)} compact />} builder={{ userId: b.userId, username: b.username, avatarEmoji: b.avatarEmoji, role: b.role as RoleType | null, level: b.level as Level | null, weeklyHours: b.weeklyHours as Commitment | null, skills: b.skills, interests: b.interests, lookingFor: b.lookingFor, lastActiveAt: b.lastActiveAt }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SortLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`rounded-[5px] border px-2.5 py-1.5 transition-colors ${active ? "border-[var(--bc-line-strong)] bg-[var(--bc-surface)] text-[var(--bc-ink)]" : "border-transparent text-[var(--bc-muted)] hover:border-[var(--bc-line)] hover:text-[var(--bc-ink)]"}`}>{children}</Link>;
}

function withSort(params: Record<string, string | undefined>, sort: string) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "sort") next.set(key, value);
  next.set("sort", sort);
  return `/builders?${next.toString()}`;
}
