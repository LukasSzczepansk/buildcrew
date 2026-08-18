"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Download, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCopy } from "@/components/i18n/locale-provider";
import { addSocialPostComment, deleteSocialPost, toggleSocialPostLike, toggleSocialPostSave } from "@/server/actions/social-posts";

export function SocialPostActions({
  postId,
  initialLiked,
  initialSaved,
  initialLikeCount,
  initialCommentCount,
  canManage = false,
  primaryHref,
  primaryLabel,
}: {
  postId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikeCount: number;
  initialCommentCount: number;
  canManage?: boolean;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  const copy = useCopy();
  const [liked, setLiked] = React.useState(initialLiked);
  const [saved, setSaved] = React.useState(initialSaved);
  const [likeCount, setLikeCount] = React.useState(initialLikeCount);
  const [commentCount, setCommentCount] = React.useState(initialCommentCount);
  const [showComment, setShowComment] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function like() {
    startTransition(async () => {
      const result = await toggleSocialPostLike(postId);
      if ("error" in result && result.error) { toast.error(result.error); return; }
      const next = "liked" in result ? Boolean(result.liked) : false;
      setLiked(next);
      setLikeCount((value) => Math.max(0, value + (next ? 1 : -1)));
    });
  }

  function save() {
    startTransition(async () => {
      const result = await toggleSocialPostSave(postId);
      if ("error" in result && result.error) { toast.error(result.error); return; }
      const next = "saved" in result ? Boolean(result.saved) : false;
      setSaved(next);
      toast.success(next ? copy("Post zapisany.", "Post saved.") : copy("Usunięto z zapisanych.", "Removed from saved."));
    });
  }

  async function share() {
    const url = `${window.location.origin}/s/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BuildCrew", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(copy("Link skopiowany.", "Link copied."));
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error(copy("Nie udało się udostępnić posta.", "Could not share the post."));
    }
  }

  function submitComment() {
    const value = comment.trim();
    if (value.length < 2) return;
    startTransition(async () => {
      const result = await addSocialPostComment(postId, value);
      if ("error" in result && result.error) { toast.error(result.error); return; }
      setComment("");
      setCommentCount((count) => count + 1);
      setShowComment(false);
      toast.success(copy("Komentarz dodany.", "Comment added."));
    });
  }

  function remove() {
    if (!window.confirm(copy("Usunąć ten post?", "Delete this post?"))) return;
    startTransition(async () => {
      const result = await deleteSocialPost(postId);
      if ("error" in result && result.error) { toast.error(result.error); return; }
      toast.success(copy("Post usunięty.", "Post deleted."));
      window.location.reload();
    });
  }

  return (
    <div className="border-t border-[var(--bc-line)] px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        <ActionButton onClick={like} disabled={pending} active={liked} ariaLabel={copy("Lubię", "Like")} icon={<Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />} label={copy("Lubię", "Like")} count={likeCount} />
        <ActionButton onClick={() => setShowComment((value) => !value)} ariaLabel={copy("Komentarz", "Comment")} icon={<MessageCircle className="h-4 w-4" />} label={copy("Komentarz", "Comment")} count={commentCount} />
        <ActionButton onClick={share} ariaLabel={copy("Udostępnij", "Share")} icon={<Share2 className="h-4 w-4" />} label={copy("Udostępnij", "Share")} />
        <ActionButton onClick={save} disabled={pending} active={saved} ariaLabel={saved ? copy("Usuń z zapisanych", "Remove saved") : copy("Zapisz", "Save")} icon={<Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />} label={saved ? copy("Zapisano", "Saved") : copy("Zapisz", "Save")} />
        <a href={`/api/posts/${postId}/share-card`} download={`${postId}-buildcrew.png`} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[var(--bc-faint)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)] sm:inline-flex" title={copy("Pobierz grafikę", "Download graphic")}><Download className="h-3.5 w-3.5" /></a>
        {canManage ? <button type="button" disabled={pending} onClick={remove} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[var(--bc-faint)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-danger)] sm:inline-flex" aria-label={copy("Usuń", "Delete")}><Trash2 className="h-3.5 w-3.5" /></button> : null}
        {primaryHref && primaryLabel ? <Link href={primaryHref} className="ml-auto inline-flex h-8 shrink-0 items-center rounded-[7px] border border-[var(--bc-accent-strong)] px-2.5 text-[11px] font-semibold text-[var(--bc-accent-strong)] transition-colors hover:bg-[color-mix(in_srgb,var(--bc-accent)_10%,transparent)] sm:h-9 sm:px-3.5 sm:text-[12px]">{primaryLabel}</Link> : null}
      </div>

      {showComment ? (
        <div className="mt-2.5 rounded-[9px] bg-[var(--bc-surface-subtle)] p-2.5 sm:p-3">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} className="min-h-[72px] resize-none bg-[var(--bc-surface)]" placeholder={copy("Napisz krótki komentarz…", "Write a short comment…")} />
          <div className="mt-2 flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setShowComment(false)}>{copy("Anuluj", "Cancel")}</Button><Button type="button" size="sm" onClick={submitComment} disabled={pending || comment.trim().length < 2}>{copy("Dodaj komentarz", "Add comment")}</Button></div>
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  active,
  ariaLabel,
  icon,
  label,
  count,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[7px] px-2 text-[11px] font-medium transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-2.5 sm:text-[12px] ${active ? "text-[var(--bc-accent-strong)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>
      {icon}<span className="hidden md:inline">{label}</span>{typeof count === "number" && count > 0 ? <span>{count}</span> : null}
    </button>
  );
}
