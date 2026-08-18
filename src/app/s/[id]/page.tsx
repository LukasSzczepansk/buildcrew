import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getSocialPostById, listSocialPostComments } from "@/server/data/social-posts";
import { getRequestLocale } from "@/lib/site-server";
import { labelsFor } from "@/lib/constants-i18n";
import { locationLabel } from "@/lib/countries";
import { socialPostKindLabel, socialPostPrimaryCta, socialPostTitle } from "@/lib/social-posts";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getSocialPostById(id);
  if (!post) return { title: "BuildCrew", robots: { index: false, follow: false } };
  const title = socialPostTitle(post, "pl");
  const description = post.body.slice(0, 180);
  return { title: `${title} | BuildCrew`, description, openGraph: { title, description, images: [`/api/posts/${id}/share-card`] }, twitter: { card: "summary_large_image", title, description, images: [`/api/posts/${id}/share-card`] } };
}

export default async function PublicSocialPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const post = await getSocialPostById(id);
  if (!post || !post.isActive || (post.expiresAt && post.expiresAt < new Date())) notFound();
  const comments = await listSocialPostComments(id, 40);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const projectPost = Boolean(post.projectId && ["UPDATE", "LOOKING_FOR_PEOPLE", "MILESTONE", "LAUNCH"].includes(post.kind));
  const destination = projectPost && post.projectId ? `/p/${post.projectId}` : post.publicProfile ? `/u/${encodeURIComponent(post.username)}` : `/signup?next=${encodeURIComponent(`/builders/${post.authorId}`)}`;
  const title = socialPostTitle(post, locale);

  return (
    <main className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <header className="border-b border-[var(--bc-line)] bg-[var(--bc-surface)]"><div className="mx-auto flex max-w-[960px] items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="text-[15px] font-semibold">BuildCrew</Link><div className="flex items-center gap-2"><LanguageSwitcher compact /><Button asChild size="sm"><Link href="/signup">{en ? "Join" : "Dołącz"}</Link></Button></div></div></header>
      <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{socialPostKindLabel(post.kind, locale)}</p>
        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.035em] sm:text-[44px]">{title}</h1>
        {projectPost && post.projectTagline ? <p className="mt-2 text-[15px] text-[var(--bc-muted)]">{post.projectTagline}</p> : null}
        <p className="mt-7 whitespace-pre-wrap text-[18px] leading-8 text-[var(--bc-ink)]">{post.body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--bc-line)] py-5">
          <div className="flex items-center gap-3"><Avatar username={post.username} seed={post.authorId} size="sm" /><div><p className="text-sm font-semibold">{post.username}</p><p className="text-[12px] text-[var(--bc-muted)]">{post.headline || (post.role ? labels.roles[post.role] : "Builder")}{locationLabel(post.city, post.country) ? ` · ${locationLabel(post.city, post.country)}` : ""} · {timeAgo(post.createdAt, locale)}</p></div></div>
          <div className="flex items-center gap-3 text-[12px] text-[var(--bc-faint)]"><span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likeCount}</span><span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.commentCount}</span></div>
        </div>
        <Button asChild className="mt-8 gap-2"><Link href={destination}>{socialPostPrimaryCta(post.kind, locale)}<ArrowRight className="h-4 w-4" /></Link></Button>

        {comments.length ? (
          <section id="comments" className="mt-12 border-t border-[var(--bc-line)] pt-7">
            <h2 className="text-[18px] font-semibold">{en ? "Comments" : "Komentarze"}</h2>
            <div className="mt-4 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {comments.map((comment) => <div key={comment.id} className="flex gap-3 py-4"><Avatar username={comment.username} seed={comment.authorId} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[13px] font-semibold">{comment.username}</p><p className="text-[11px] text-[var(--bc-faint)]">{timeAgo(comment.createdAt, locale)}</p></div><p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-[var(--bc-muted)]">{comment.body}</p></div></div>)}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
