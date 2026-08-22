import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Code2, ExternalLink, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { LaunchDiscussion } from "@/components/launches/launch-discussion";
import { LaunchGallery } from "@/components/launches/launch-gallery";
import { LaunchOwnerActions } from "@/components/launches/launch-owner-actions";
import { LaunchVoteButton } from "@/components/launches/launch-vote-button";
import { getCurrentUser } from "@/lib/auth";
import { launchCategoryLabel, launchNeedLabel, launchStatusLabel } from "@/lib/launches";
import { SITE_URL } from "@/lib/site-config";
import { getRequestLocale } from "@/lib/site-server";
import { getFriendshipState } from "@/server/data/friends";
import { getLaunchBySlug } from "@/server/data/launches";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const launch = await getLaunchBySlug(slug);
  if (!launch) return { title: "Premiera - BuildCrew" };
  const title = `${launch.title} - BuildCrew`;
  const description = `${launch.title} - ${launch.tagline} Zobacz projekt i daj feedback na BuildCrew.`.slice(0, 180);
  const url = `${SITE_URL}/launches/${launch.slug}`;
  const image = launch.images[0] ? `${SITE_URL}/api/launches/images/${launch.images[0].id}` : undefined;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", images: image ? [{ url: image }] : undefined }, twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined }, robots: { index: true, follow: true } };
}

export default async function LaunchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  const launch = await getLaunchBySlug(slug, user?.id);
  if (!launch) notFound();
  const friendship = user && user.id !== launch.creatorId ? await getFriendshipState(user.id, launch.creatorId) : null;
  const returnTo = `/launches/${launch.slug}`;
  const contactHref = !user ? `/login?next=${encodeURIComponent(returnTo)}` : friendship?.kind === "FRIENDS" && friendship.conversationId ? `/messages/${friendship.conversationId}` : `/builders/${launch.creatorId}`;
  const contactLabel = launch.needs.includes("TEAM") ? (en ? "I want to join" : "Chcę dołączyć") : (en ? "Contact creator" : "Skontaktuj się z twórcą");

  return (
    <div>
      {user ? <Topbar title={en ? "Launches" : "Premiery"} subtitle={en ? "Project details, feedback and people behind the build." : "Szczegóły projektu, feedback i osoby, które za nim stoją."} /> : null}
      <div className="max-w-[1040px]">
        <Link href="/launches" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"><ArrowLeft className="h-3.5 w-3.5" />{en ? "Back to launches" : "Wróć do premier"}</Link>
        <section className="mt-6 border-b border-[var(--bc-line)] pb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-4">{launch.images[0] ? <img src={`/api/launches/images/${launch.images[0].id}`} alt="" className="h-16 w-16 shrink-0 rounded-[9px] border border-[var(--bc-line)] object-cover object-top sm:h-20 sm:w-20" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-xl font-semibold text-[var(--bc-faint)] sm:h-20 sm:w-20">{launch.title.slice(0, 2).toUpperCase()}</div>}<div className="min-w-0"><h1 className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[36px]">{launch.title}</h1><p className="mt-1 max-w-[690px] text-[13px] leading-6 text-[var(--bc-muted)] sm:text-[14px]">{launch.tagline}</p><div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-[var(--bc-muted)]"><span className="rounded-[5px] border border-[var(--bc-line)] px-2 py-1">{launchCategoryLabel(launch.category, locale)}</span><span className="rounded-[5px] border border-[var(--bc-line)] px-2 py-1">{launchStatusLabel(launch.status, locale)}</span>{launch.technologies.slice(0, 6).map((tech) => <span key={tech} className="rounded-[5px] border border-[var(--bc-line)] px-2 py-1">{tech}</span>)}</div></div></div>
              {launch.needs.length ? <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-[var(--bc-muted)]">{launch.needs.map((need) => <span key={need}>{launchNeedLabel(need, locale)}</span>)}</div> : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2"><LaunchVoteButton entryId={launch.id} count={launch.voteCount} voted={launch.viewerVoted} canVote={Boolean(user)} returnTo={returnTo} />{launch.liveUrl ? <Button asChild variant="outline" className="gap-1.5"><a href={launch.liveUrl} target="_blank" rel="noopener noreferrer">{en ? "Visit project" : "Odwiedź projekt"}<ExternalLink className="h-3.5 w-3.5" /></a></Button> : null}</div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--bc-faint)]"><Avatar username={launch.username} seed={launch.avatarEmoji || launch.creatorId} size="sm" />{launch.creatorPublicProfile ? <Link href={`/u/${launch.username}`} className="font-medium text-[var(--bc-ink)] hover:underline">{launch.username}</Link> : <span className="font-medium text-[var(--bc-ink)]">{launch.username}</span>}<span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{launch.comments.length} {en ? "comments" : "komentarzy"}</span>{launch.githubUrl ? <a href={launch.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--bc-ink)]"><Code2 className="h-3.5 w-3.5" />GitHub</a> : null}</div>{user?.id === launch.creatorId ? <LaunchOwnerActions entryId={launch.id} slug={launch.slug} en={en} /> : null}</div>
        </section>

        {launch.images.length ? <div className="py-7"><LaunchGallery images={launch.images} title={launch.title} /></div> : null}

        <div className="grid gap-8 border-t border-[var(--bc-line)] py-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "About the project" : "O projekcie"}</h2><p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-[var(--bc-muted)] sm:text-[14px]">{launch.description}</p></section>
          <aside className="border-t border-[var(--bc-line)] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><h2 className="text-[13px] font-semibold">{en ? "Creators" : "Twórcy"}</h2><div className="mt-3 space-y-3">{launch.team.map((member) => <div key={member.userId} className="flex items-center gap-2.5"><Avatar username={member.username} seed={member.avatarEmoji || member.userId} size="sm" /><div className="min-w-0"><p className="truncate text-[12px] font-medium">{member.publicProfile ? <Link href={`/u/${member.username}`} className="hover:underline">{member.username}</Link> : member.username}</p><p className="truncate text-[10px] text-[var(--bc-faint)]">{member.role || (en ? "Builder" : "Twórca")}</p></div></div>)}</div>{user?.id !== launch.creatorId && launch.needs.includes("TEAM") ? <Button asChild size="sm" className="mt-5 w-full"><Link href={contactHref}>{contactLabel}</Link></Button> : user?.id !== launch.creatorId && user ? <Button asChild variant="outline" size="sm" className="mt-5 w-full"><Link href={contactHref}>{contactLabel}</Link></Button> : !user ? <Button asChild variant="outline" size="sm" className="mt-5 w-full"><Link href={contactHref}>{contactLabel}</Link></Button> : null}</aside>
        </div>

        <LaunchDiscussion entryId={launch.id} comments={launch.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() }))} viewerId={user?.id} en={en} returnTo={returnTo} />
      </div>
    </div>
  );
}
