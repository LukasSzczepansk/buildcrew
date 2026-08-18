import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filters/filter-bar";
import { INTEREST_OPTIONS, SKILL_GROUPS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/international";
import { countryLabel } from "@/lib/countries";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { computeMatch } from "@/lib/matching";
import { BUILDING_INTENTS, WORK_INTENTS, isOpenToOpportunities } from "@/lib/opportunities";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { listFollowing } from "@/server/data/network";
import { listProjectsForOwner } from "@/server/data/projects";
import { QuickInviteButton } from "@/components/builders/quick-invite-button";
import { FollowButton } from "@/components/network/follow-button";
import type { Commitment, Goal, Level, LookingFor, RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "People - BuildCrew" : "Ludzie - BuildCrew" }; }

export default async function BuildersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const labels = labelsFor(locale);
  const en = locale === "en";
  const params = await searchParams;

  const [myProfile, allBuilders, following, ownedProjects] = await Promise.all([getProfileByUserId(user.id), listBuilderProfiles(user.id), listFollowing(user.id), listProjectsForOwner(user.id)]);
  if (!myProfile) redirect("/onboarding");

  let builders = allBuilders.filter((b) => b.onboardingCompleted);
  if (params.group === "build") builders = builders.filter((b) => BUILDING_INTENTS.some((intent) => b.lookingFor.includes(intent)));
  if (params.group === "work") builders = builders.filter((b) => WORK_INTENTS.some((intent) => b.lookingFor.includes(intent)));
  if (params.role) builders = builders.filter((b) => b.role === params.role);
  if (params.skill) builders = builders.filter((b) => b.skills.includes(params.skill!));
  if (params.level) builders = builders.filter((b) => b.level === params.level);
  if (params.interest) builders = builders.filter((b) => b.interests.includes(params.interest!));
  if (params.intent) builders = builders.filter((b) => b.lookingFor.includes(params.intent as LookingFor));
  if (params.language) builders = builders.filter((b) => b.languages.includes(params.language!));
  if (params.country) builders = builders.filter((b) => b.country === params.country);
  if (params.q) {
    const query = params.q.trim().toLowerCase();
    builders = builders.filter((b) => {
      const roleLabel = b.role ? labels.roles[b.role as RoleType] : "";
      return [b.username, b.headline ?? "", roleLabel, ...b.skills, ...b.interests].some((value) => value.toLowerCase().includes(query));
    });
  }

  const sort = params.sort === "open" || params.sort === "active" ? params.sort : "match";
  const followingIds = new Set(following.map((item) => item.profile.userId));
  const ranked = builders
    .map((builder) => {
      const match = computeMatch(
        { userId: myProfile.userId, username: myProfile.username, role: myProfile.role as RoleType | null, level: myProfile.level as Level | null, weeklyHours: myProfile.weeklyHours as Commitment | null, interests: myProfile.interests, goals: myProfile.goals as Goal[], skills: myProfile.skills, lookingFor: myProfile.lookingFor, languages: myProfile.languages, workModePreference: myProfile.workModePreference, country: myProfile.country, lastActiveAt: myProfile.lastActiveAt },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[], skills: builder.skills, lookingFor: builder.lookingFor, languages: builder.languages, workModePreference: builder.workModePreference, country: builder.country, lastActiveAt: builder.lastActiveAt },
        locale,
      );
      return { builder, ...match };
    })
    .sort((a, b) => {
      if (sort === "open") {
        const aOpen = isOpenToOpportunities(a.builder.lookingFor) ? 1 : 0;
        const bOpen = isOpenToOpportunities(b.builder.lookingFor) ? 1 : 0;
        return bOpen - aOpen || b.score - a.score;
      }
      if (sort === "active") {
        const aTime = a.builder.lastActiveAt ? new Date(a.builder.lastActiveAt).getTime() : 0;
        const bTime = b.builder.lastActiveAt ? new Date(b.builder.lastActiveAt).getTime() : 0;
        return bTime - aTime || b.score - a.score;
      }
      return b.score - a.score;
    });

  const currentView = params.intent === "COFOUNDER" ? "cofounders" : params.group === "work" ? "work" : params.group === "build" ? "build" : "all";

  return (
    <div>
      <Topbar title={en ? "People" : "Ludzie"} subtitle={en ? "Find teammates, co-founders, collaborators and people open to their next professional opportunity." : "Znajdź ludzi do projektu, co-founderów, współtwórców i osoby otwarte na nowe możliwości."} />

      <div className="mb-5 flex flex-wrap gap-1 border-b border-[var(--bc-line)] text-[13px] font-medium">
        <DiscoveryTab href="/builders" active={currentView === "all"}>{en ? "For you" : "Dla Ciebie"}</DiscoveryTab>
        <DiscoveryTab href="/builders?group=build" active={currentView === "build"}>{en ? "Open to building" : "Otwarci na projekty"}</DiscoveryTab>
        <DiscoveryTab href="/builders?group=work" active={currentView === "work"}>{en ? "Open to work" : "Otwarci na pracę"}</DiscoveryTab>
        <DiscoveryTab href="/builders?intent=COFOUNDER" active={currentView === "cofounders"}>{en ? "Co-founders" : "Co-founderzy"}</DiscoveryTab>
        <DiscoveryTab href="/network" active={false}>{en ? "My network" : "Moja sieć"}</DiscoveryTab>
      </div>

      <div className="mb-5 grid gap-3 border-b border-[var(--bc-line)] pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "What you're open to" : "Na co jesteś otwarty"}</p>
          <p className="mt-1 max-w-[760px] text-sm leading-5 text-[var(--bc-muted)]">{myProfile.lookingFor.length ? myProfile.lookingFor.map((item) => labels.lookingFor[item]).join(" · ") : (en ? "Complete your profile to improve recommendations and let people know why they should reach out." : "Uzupełnij profil, aby poprawić rekomendacje i pokazać innym, dlaczego warto się odezwać.")}</p>
        </div>
        <div className="flex flex-wrap gap-1 text-[12px] font-medium">
          <SortLink href={withSort(params, "match")} active={sort === "match"}>{en ? "Best match" : "Najlepsze dopasowanie"}</SortLink>
          <SortLink href={withSort(params, "open")} active={sort === "open"}>{en ? "Open now" : "Dostępni teraz"}</SortLink>
          <SortLink href={withSort(params, "active")} active={sort === "active"}>{en ? "Recently active" : "Ostatnio aktywni"}</SortLink>
        </div>
      </div>

      <FilterBar
        showSearch
        searchPlaceholder={en ? "Search people, roles, skills or interests" : "Szukaj ludzi, ról, umiejętności lub zainteresowań"}
        filters={[
          { key: "role", label: en ? "Role" : "Rola", options: Object.entries(labels.roles).map(([value, label]) => ({ value, label })) },
          { key: "skill", label: en ? "Skill" : "Umiejętność", options: Object.values(SKILL_GROUPS).flat().map((s) => ({ value: s, label: s })) },
          { key: "level", label: en ? "Experience" : "Doświadczenie", options: Object.entries(labels.levels).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: en ? "Interest" : "Zainteresowanie", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
          { key: "intent", label: en ? "Open to" : "Szukam", options: Object.entries(labels.lookingFor).map(([value, label]) => ({ value, label })) },
          { key: "language", label: en ? "Language" : "Język", options: LANGUAGE_OPTIONS.map((value) => ({ value, label: value })) },
          { key: "country", label: en ? "Country" : "Kraj", options: COUNTRY_OPTIONS.map((value) => ({ value, label: countryLabel(value) })) },
        ]}
      />

      {ranked.length === 0 ? (
        <EmptyState className="mt-6" title={en ? "No people match these filters" : "Nikt nie pasuje do tych filtrów"} description={en ? "Try broader filters or update your profile so BuildCrew can find better matches for you." : "Poszerz filtry albo uzupełnij profil, żeby BuildCrew mogło znaleźć lepsze dopasowania."} ctaLabel={en ? "Edit profile" : "Edytuj profil"} ctaHref="/profile" />
      ) : (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "People to meet" : "Ludzie, których warto poznać"}</h2><p className="mt-0.5 text-[12px] text-[var(--bc-faint)]">{en ? "Build a network around real skills, projects and collaboration." : "Buduj sieć wokół realnych umiejętności, projektów i współpracy."}</p></div>
            <span className="text-[13px] tabular-nums text-[var(--bc-faint)]">{ranked.length} {en ? (ranked.length === 1 ? "person" : "people") : (ranked.length === 1 ? "osoba" : "osób")}</span>
          </div>
          <div className="space-y-2.5">
            {ranked.map(({ builder: b, score, reasons }) => (
              <BuilderCard locale={locale} key={b.userId} matchScore={score} matchReasons={reasons} action={<><QuickInviteButton targetUserId={b.userId} projects={ownedProjects.filter((project) => project.lifecycleStatus === "ACTIVE").map((project) => ({ id: project.id, name: project.name }))} /><FollowButton targetUserId={b.userId} initialFollowing={followingIds.has(b.userId)} compact /></>} builder={{ userId: b.userId, username: b.username, headline: b.headline, avatarEmoji: b.avatarEmoji, role: b.role as RoleType | null, level: b.level as Level | null, weeklyHours: b.weeklyHours as Commitment | null, skills: b.skills, interests: b.interests, lookingFor: b.lookingFor, languages: b.languages, country: b.country, city: b.city, workModePreference: b.workModePreference, lastActiveAt: b.lastActiveAt, createdAt: b.createdAt }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DiscoveryTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`relative px-3 py-2.5 transition-colors ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>{children}{active ? <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--bc-accent)]" /> : null}</Link>;
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
