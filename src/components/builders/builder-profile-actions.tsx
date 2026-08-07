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
import { inviteToProject } from "@/server/actions/projects";
import { blockUser } from "@/server/actions/moderation";

export function BuilderProfileActions({
  targetUserId,
  myProjects,
  friendState,
}: {
  targetUserId: string;
  myProjects: { id: string; name: string }[];
  friendState: FriendRelationState;
}) {
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
      toast.error(res.error);
      return;
    }
    toast.success("Zaproszenie wysłane!");
    setInviteOpen(false);
    setMessage("");
  }

  async function handleBlock() {
    const res = await blockUser(targetUserId);
    if (res?.error) toast.error(res.error);
    else toast.success("Użytkownik zablokowany.");
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <FriendRelationActions targetUserId={targetUserId} state={friendState} />

      {myProjects.length > 0 && (
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Zaproś do projektu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zaproś do projektu</DialogTitle>
              <DialogDescription>Wybierz projekt i dodaj krótką wiadomość.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt" />
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
                placeholder="Cześć! Szukamy kogoś takiego jak Ty…"
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleInvite} disabled={pending || !projectId}>
                {pending ? "Wysyłanie…" : "Wyślij zaproszenie"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <MoreHorizontal className="h-4 w-4" /> Więcej opcji
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setReportOpen(true)}>Zgłoś użytkownika</DropdownMenuItem>
          <DropdownMenuItem onClick={handleBlock} className="text-red-600">
            Zablokuj użytkownika
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} reportedId={targetUserId} />
    </Card>
  );
}
