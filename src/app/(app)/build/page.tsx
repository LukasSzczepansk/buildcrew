import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/filters/filter-bar";
import { BuildPoolCard } from "@/components/build/build-pool-card";
import { BuildPoolListingManager } from "@/components/build/build-pool-listing-manager";
import { EmptyState } from "@/components/empty-state";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
import { INTEREST_OPTIONS, SKILL_GROUPS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getProfileByUserId } from "@/server/data/profiles";
import { getMembershipCrewForUser } from "@/server/data/crews";
import { getBuildPoolListingForUser, listActiveBuildPoolListings } from "@/server/data/build-pool";
import { computeMatch } from "@/lib/matching";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Open to building - BuildCrew" : "Build Pool - BuildCrew" }; }

export default async function BuildPoolPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const locale = await getRequestLocale(); const en = locale === "en"; const labels = labelsFor(locale);
  const params = await searchParams;
  const [myProfile, listingRows, myListing, myCrewId] = await Promise.all([getProfileByUserId(user.id), listActiveBuildPoolListings(user.id), getBuildPoolListingForUser(user.id), getMembershipCrewForUser(user.id)]);
  if (!myProfile) redirect("/onboarding");
  let pool = listingRows;
  if (params.role) pool = pool.filter((item) => item.role === params.role);
  if (params.skill) pool = pool.filter((item) => item.technologies.includes(params.skill!));
  if (params.level) pool = pool.filter((item) => item.level === params.level);
  if (params.interest) pool = pool.filter((item) => item.profile.interests.includes(params.interest!));
  const ranked = pool.map((item) => {
    const match = computeMatch(
      { userId: myProfile.userId, username: myProfile.username, role: myProfile.role as RoleType | null, level: myProfile.level as Level | null, weeklyHours: myProfile.weeklyHours as Commitment | null, interests: myProfile.interests, goals: myProfile.goals as Goal[] },
      { userId: item.profile.userId, username: item.profile.username, role: item.profile.role as RoleType | null, level: item.profile.level as Level | null, weeklyHours: item.profile.weeklyHours as Commitment | null, interests: item.profile.interests, goals: item.profile.goals as Goal[] },
      locale,
    );
    return { ...item, reasons: match.reasons, score: match.score };
  }).sort((a, b) => b.score - a.score);
  const technologyOptions = [...new Set([...Object.values(SKILL_GROUPS).flat(), ...listingRows.flatMap((item) => item.technologies)])].sort((a, b) => a.localeCompare(b)).map((technology) => ({ value: technology, label: technology }));

  return <div>
    <Topbar title={en ? "Open to building" : "Build Pool"} subtitle={en ? "Meet people ready to start something together, even before there is a fully defined project." : "Find people ready to build together - even if you do not have a specific idea yet."} />
    <DiscoveryTabs active="people" />
    <div className="mt-6"><BuildPoolListingManager listing={myListing ? { headline: myListing.headline, role: myListing.role, technologies: myListing.technologies, wantsToBuild: myListing.wantsToBuild, avoids: myListing.avoids, weeklyHours: myListing.weeklyHours, preferredCrewSize: myListing.preferredCrewSize, level: myListing.level, description: myListing.description, status: myListing.status } : null} activeCrew={Boolean(myCrewId)} defaults={{ role: myProfile.role as RoleType | null, level: myProfile.level as Level | null, weeklyHours: myProfile.weeklyHours as Commitment | null, skills: myProfile.skills }} /></div>
    <div className="mt-6"><FilterBar filters={[
      { key: "role", label: en ? "Roles" : "Roles", options: Object.entries(labels.roles).map(([value, label]) => ({ value, label })) },
      { key: "skill", label: en ? "Technology" : "Technology", options: technologyOptions },
      { key: "level", label: en ? "Level" : "Level", options: Object.entries(labels.levels).map(([value, label]) => ({ value, label })) },
      { key: "interest", label: en ? "Interests" : "Interests", options: INTEREST_OPTIONS.map((interest) => ({ value: interest, label: interest })) },
    ]} /></div>
    {ranked.length === 0 ? <EmptyState className="mt-6" title={en ? "No active profiles match these filters." : "No active listings match these filters."} description={en ? "Publish your own availability or broaden the filters." : "Create your own listing or change the filters."} /> : <section className="mt-8"><div className="mb-4 flex items-end justify-between gap-5"><div><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "Best matches" : "Best matches"}</h2></div><span className="text-sm text-[var(--bc-faint)]">{ranked.length} {en ? "active" : "aktywnych"}</span></div><div className="space-y-2.5">{ranked.map((item) => <BuildPoolCard key={item.id} myCrewId={myCrewId} person={{ userId: item.userId, username: item.profile.username, avatarEmoji: item.profile.avatarEmoji, headline: item.headline, role: item.role, level: item.level, weeklyHours: item.weeklyHours, technologies: item.technologies, wantsToBuild: item.wantsToBuild, avoids: item.avoids, preferredCrewSize: item.preferredCrewSize, description: item.description, reasons: item.reasons, matchScore: item.score }} />)}</div></section>}
  </div>;
}
