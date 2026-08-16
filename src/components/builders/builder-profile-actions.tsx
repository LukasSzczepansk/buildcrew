"use client";

import * as React from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportDialog } from "@/components/moderation/report-dialog";
import { FriendRelationActions, type FriendRelationState } from "@/components/friends/friend-relation-actions";
import { FollowButton } from "@/components/network/follow-button";
import { inviteToProject } from "@/server/actions/projects";
import { blockUser } from "@/server/actions/moderation";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";

export function BuilderProfileActions({
  targetUserId,
  myProjects,
  friendState,
  initialFollowing,
}: {
  targetUserId: string;
  myProjects: { id: string; name: string }[];
  friendState: FriendRelationState;
  initialFollowing: boolean;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string>(myProjects[0]?.id ?? "");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleInvite() {
    if (!projectId) return;
    setPending(true);
    const res = await inviteToProject(projectId, targetUserId, undefined, message);
    setPending(false);
    if (res?.error) {
      toast.error(appMessage(res.error, locale));
      return;
    }
    toast.success(copy("Zaproszenie wysłane!", "Invitation sent!"));
    setInviteOpen(false);
    setMessage("");
  }

  async function handleBlock() {
    const res = await blockUser(targetUserId);
    if (res?.error) toast.error(appMessage(res.error, locale));
    else toast.success(copy("Użytkownik zablokowany.", "User blocked."));
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <FollowButton targetUserId={targetUserId} initialFollowing={initialFollowing} />
      <FriendRelationActions targetUserId={targetUserId} state={friendState} />

      {myProjects.length > 0 && (
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> {copy("Zaproś do projektu", "Invite to project")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy("Zaproś do projektu", "Invite to project")}</DialogTitle>
              <DialogDescription>{copy("Wybierz projekt i dodaj krótką wiadomość.", "Choose a project and add a short message.")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={copy("Wybierz projekt", "Choose a project")} />
                </SelectTrigger>
                <SelectContent>
                  {myProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder={copy("Cześć! Szukamy kogoś takiego jak Ty...", "Hi! We are looking for someone with your profile...")}
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleInvite} disabled={pending || !projectId}>
                {pending ? copy("Wysyłanie...", "Sending...") : copy("Wyślij zaproszenie", "Send invitation")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <MoreHorizontal className="h-4 w-4" /> {copy("Więcej opcji", "More options")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setReportOpen(true)}>{copy("Zgłoś użytkownika", "Report user")}</DropdownMenuItem>
          <DropdownMenuItem onClick={handleBlock} className="text-red-600">
            {copy("Zablokuj użytkownika", "Block user")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} reportedId={targetUserId} />
    </Card>
  );
}
