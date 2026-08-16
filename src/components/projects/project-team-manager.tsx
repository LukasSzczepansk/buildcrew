"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { LogOut, MoreHorizontal, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RoleType } from "@/db/schema";
import { leaveProject, removeProjectMember } from "@/server/actions/projects";

type Member = {
  userId: string;
  isOwner: boolean;
  roleType: RoleType | null;
  joinedAt: string;
  profile: { username: string; role: RoleType | null } | null;
};

export function ProjectTeamManager({ projectId, members }: { projectId: string; members: Member[] }) {
  const router = useRouter();
  const copy = useCopy();
  const locale = useLocale();
  const roleLabels = labelsFor(locale).roles;
  const [pending, startTransition] = React.useTransition();
  const [selected, setSelected] = React.useState<Member | null>(null);

  function confirmRemoval() {
    if (!selected) return;
    startTransition(async () => {
      const result = await removeProjectMember(projectId, selected.userId);
      if ("error" in result && result.error) {
        toast.error(appMessage(result.error, locale));
        return;
      }
      toast.success(copy(`${selected.profile?.username ?? "This person"} is no longer in the project.`, `${selected.profile?.username ?? "This person"} is no longer in the project.`));
      setSelected(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
        {members.map((member) => {
          const username = member.profile?.username ?? "Builder";
          return (
            <div key={member.userId} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_180px_110px_40px] sm:items-center">
              <Link href={`/builders/${member.userId}`} className="flex min-w-0 items-center gap-3">
                <Avatar username={username} seed={member.userId} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{username}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--bc-faint)]">{member.isOwner ? copy("Project creator", "Project creator") : member.profile?.role ? roleLabels[member.profile.role] : copy("Team member", "Team member")}</p>
                </div>
              </Link>

              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Project role", "Project role")}</p>
                <p className="mt-1 text-[13px] text-[var(--bc-ink)]">{member.isOwner ? copy("Owner", "Owner") : member.roleType ? roleLabels[member.roleType] : copy("No assigned role", "No assigned role")}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Joined", "Joined")}</p>
                <p className="mt-1 text-[12px] text-[var(--bc-muted)]">{formatDate(member.joinedAt, locale)}</p>
              </div>

              {member.isOwner ? <span /> : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={copy(`Options for ${username}`, `Options for ${username}`)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild><Link href={`/builders/${member.userId}`}>{copy("View profile", "View profile")}</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-700 focus:text-red-700 dark:text-red-400" onSelect={() => setSelected(member)}>
                      <UserMinus className="h-4 w-4" /> {copy("Remove from project", "Remove from project")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !pending) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy("Remove this person from the project?", "Remove this person from the project?")}</DialogTitle>
            <DialogDescription>
              {copy(`${selected?.profile?.username ?? "This person"} will lose access to the private workspace, new team messages and project tasks.`, `${selected?.profile?.username ?? "This person"} will lose access to the private workspace, new team messages and project tasks.`)}
            </DialogDescription>
          </DialogHeader>
          <div className="border-y border-[var(--bc-line)] py-3 text-[13px] leading-5 text-[var(--bc-muted)]">
            {copy("Previous messages and change history will remain in the project so the rest of the team keeps its context. Tasks assigned to this person will become unassigned.", "Previous messages and change history will remain in the project so the rest of the team keeps its context. Tasks assigned to this person will become unassigned.")}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setSelected(null)}>{copy("Cancel", "Cancel")}</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmRemoval}>{pending ? copy("Removing…", "Removing…") : copy("Remove from project", "Remove from project")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LeaveProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const copy = useCopy();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function confirmLeave() {
    startTransition(async () => {
      const result = await leaveProject(projectId);
      if ("error" in result && result.error) {
        toast.error(appMessage(result.error, locale));
        return;
      }
      toast.success(copy(`You left ${projectName}.`, `You left ${projectName}.`));
      setOpen(false);
      router.push("/my-projects");
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-[var(--bc-muted)] hover:text-red-700" onClick={() => setOpen(true)}>
        <LogOut className="h-3.5 w-3.5" /> {copy("Leave project", "Leave project")}
      </Button>
      <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy(`Leave ${projectName}?`, `Leave ${projectName}?`)}</DialogTitle>
            <DialogDescription>{copy("You will lose access to the project’s private workspace and new team messages.", "You will lose access to the project’s private workspace and new team messages.")}</DialogDescription>
          </DialogHeader>
          <div className="border-y border-[var(--bc-line)] py-3 text-[13px] leading-5 text-[var(--bc-muted)]">
            {copy("Your previous messages may remain in the project history. Tasks assigned to you will become unassigned.", "Your previous messages may remain in the project history. Tasks assigned to you will become unassigned.")}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>{copy("Stay in project", "Stay in project")}</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmLeave}>{pending ? copy("Leaving…", "Leaving…") : copy("Leave project", "Leave project")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(value: string, locale: "pl" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
