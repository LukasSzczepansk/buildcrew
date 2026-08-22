"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, Reply, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addLaunchComment, deleteLaunchComment } from "@/server/actions/launches";

type Comment = { id: string; parentId: string | null; body: string; createdAt: string; authorId: string; username: string; avatarEmoji: string; publicProfile: boolean };

function formatDate(value: string, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function LaunchDiscussion({ entryId, comments, viewerId, en = false, returnTo }: { entryId: string; comments: Comment[]; viewerId?: string; en?: boolean; returnTo: string }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<Comment | null>(null);
  const [pending, startTransition] = React.useTransition();
  const roots = comments.filter((comment) => !comment.parentId);
  const replies = new Map<string, Comment[]>();
  for (const comment of comments.filter((comment) => comment.parentId)) replies.set(comment.parentId!, [...(replies.get(comment.parentId!) ?? []), comment]);

  function submit() {
    if (!viewerId) { router.push(`/login?next=${encodeURIComponent(returnTo)}`); return; }
    if (body.trim().length < 2) return;
    startTransition(async () => {
      const result = await addLaunchComment(entryId, { body, parentId: replyTo?.id });
      if (result.error) { toast.error(result.error); return; }
      setBody(""); setReplyTo(null); router.refresh();
    });
  }

  function remove(commentId: string) {
    startTransition(async () => {
      const result = await deleteLaunchComment(commentId);
      if (result.error) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={isReply ? "ml-9 border-l border-[var(--bc-line)] pl-4" : ""}>
      <div className="flex gap-3 py-4">
        <Avatar username={comment.username} seed={comment.avatarEmoji || comment.authorId} size="sm" className="h-8 w-8 text-[11px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[12px] font-semibold text-[var(--bc-ink)]">{comment.publicProfile ? <Link href={`/u/${comment.username}`} className="hover:underline">{comment.username}</Link> : comment.username}</span><span className="text-[10px] text-[var(--bc-faint)]">{formatDate(comment.createdAt, en)}</span></div>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-[var(--bc-muted)]">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--bc-faint)]">{!isReply ? <button type="button" className="inline-flex items-center gap-1 hover:text-[var(--bc-ink)]" onClick={() => { setReplyTo(comment); setBody(""); }}><Reply className="h-3 w-3" />{en ? "Reply" : "Odpowiedz"}</button> : null}{viewerId === comment.authorId ? <button type="button" disabled={pending} className="inline-flex items-center gap-1 hover:text-[var(--bc-danger)]" onClick={() => remove(comment.id)}><Trash2 className="h-3 w-3" />{en ? "Delete" : "Usuń"}</button> : null}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="discussion" className="border-t border-[var(--bc-line)] pt-7">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "Discussion" : "Dyskusja"}</h2><p className="mt-1 text-[12px] text-[var(--bc-faint)]">{en ? "Give useful feedback, ask a question or share an idea." : "Daj konkretny feedback, zadaj pytanie albo podziel się pomysłem."}</p></div><span className="inline-flex items-center gap-1 text-[11px] text-[var(--bc-faint)]"><MessageCircle className="h-3.5 w-3.5" />{comments.length}</span></div>
      <div className="mt-5 rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-3.5 sm:p-4">
        {replyTo ? <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[var(--bc-muted)]"><span>{en ? `Replying to ${replyTo.username}` : `Odpowiadasz ${replyTo.username}`}</span><button type="button" onClick={() => setReplyTo(null)} className="hover:text-[var(--bc-ink)]">{en ? "Cancel" : "Anuluj"}</button></div> : null}
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={900} className="min-h-24 resize-y border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder={en ? "Write what you think..." : "Napisz, co o tym myślisz..."} />
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-3"><span className="text-[10px] text-[var(--bc-faint)]">{body.length}/900</span>{viewerId ? <Button type="button" size="sm" disabled={pending || body.trim().length < 2} onClick={submit}>{pending ? (en ? "Posting…" : "Publikowanie…") : (en ? "Comment" : "Dodaj komentarz")}</Button> : <Button asChild size="sm"><Link href={`/login?next=${encodeURIComponent(returnTo)}`}>{en ? "Sign in to comment" : "Zaloguj się, aby skomentować"}</Link></Button>}</div>
      </div>
      {comments.length ? <div className="mt-4 divide-y divide-[var(--bc-line)]">{roots.map((comment) => <div key={comment.id}>{renderComment(comment)}{(replies.get(comment.id) ?? []).map((reply) => renderComment(reply, true))}</div>)}</div> : <div className="mt-5 border-y border-[var(--bc-line)] py-8 text-center"><p className="text-[13px] font-medium">{en ? "No feedback yet." : "Jeszcze nikt nie dodał feedbacku."}</p><p className="mt-1 text-[11px] text-[var(--bc-faint)]">{en ? "Be the first to leave something useful." : "Możesz zostawić pierwszy konkretny komentarz."}</p></div>}
    </section>
  );
}
