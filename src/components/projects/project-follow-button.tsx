"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { followProject, unfollowProject } from "@/server/actions/social-projects";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";

export function ProjectFollowButton({ projectId, initialFollowing, initialFollowers = 0, owner = false, compact = false }: { projectId: string; initialFollowing: boolean; initialFollowers?: number; owner?: boolean; compact?: boolean }) {
  const locale = useLocale();
  const copy = useCopy();
  const en = locale === "en";
  const [following, setFollowing] = React.useState(initialFollowing);
  const [followers, setFollowers] = React.useState(initialFollowers);
  const [pending, startTransition] = React.useTransition();

  if (owner) {
    return <span className="inline-flex h-9 items-center gap-1.5 text-[12px] text-[var(--bc-muted)]"><Eye className="h-3.5 w-3.5" />{followers} {en ? (followers === 1 ? "follower" : "followers") : (followers === 1 ? "follower" : "followers")}</span>;
  }

  function toggle() {
    const next = !following;
    setFollowing(next);
    setFollowers((value) => Math.max(0, value + (next ? 1 : -1)));
    startTransition(async () => {
      const result = next ? await followProject(projectId) : await unfollowProject(projectId);
      if (result?.error) {
        setFollowing(!next);
        setFollowers((value) => Math.max(0, value + (next ? -1 : 1)));
        toast.error(appMessage(result.error, locale));
        return;
      }
      toast.success(next ? copy("You are following this project.", "You are following this project.") : copy("You stopped following this project.", "You stopped following this project."));
    });
  }

  return (
    <Button type="button" variant={following ? "secondary" : "outline"} size={compact ? "sm" : "default"} onClick={toggle} disabled={pending} className="gap-1.5">
      {following ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      {following ? copy("Following", "Following") : copy("Follow", "Follow")}
      <span className="text-[11px] tabular-nums opacity-65">{followers}</span>
    </Button>
  );
}
