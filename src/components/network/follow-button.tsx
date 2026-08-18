"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { followUser, unfollowUser } from "@/server/actions/network";

export function FollowButton({ targetUserId, initialFollowing, compact = false }: { targetUserId: string; initialFollowing: boolean; compact?: boolean }) {
  const copy = useCopy();
  const locale = useLocale();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const result = following ? await unfollowUser(targetUserId) : await followUser(targetUserId);
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    setFollowing(!following);
    toast.success(following ? copy("Przestajesz obserwować tę osobę.", "You stopped following this person.") : copy("Obserwujesz tę osobę.", "You are now following this person."));
  }

  return (
    <Button type="button" size={compact ? "sm" : "default"} variant={following ? "outline" : "secondary"} className={compact ? "shrink-0 gap-1.5 px-3" : "gap-2"} disabled={pending} onClick={toggle}>
      {following ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {following ? copy("Obserwujesz", "Following") : copy("Obserwuj", "Follow")}
    </Button>
  );
}
