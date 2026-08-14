"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ROLE_LABELS } from "@/lib/constants";
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
  const [pending, startTransition] = React.useTransition();
  const [selected, setSelected] = React.useState<Member | null>(null);

  function confirmRemoval() {
    if (!selected) return;
    startTransition(async () => {
      const result = await removeProjectMember(projectId, selected.userId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${selected.profile?.username ?? "Użytkownik"} nie należy już do projektu.`);
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
                  <p className="truncate text-[13px] font-medium text-[var(--bc-ink)]">{username}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--bc-faint)]">{member.isOwner ? "Twórca projektu" : member.profile?.role ? ROLE_LABELS[member.profile.role] : "Członek zespołu"}</p>
                </div>
              </Link>

              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">Rola w projekcie</p>
                <p className="mt-1 text-[12px] text-[var(--bc-ink)]">{member.isOwner ? "Autor" : member.roleType ? ROLE_LABELS[member.roleType] : "Bez przypisanej roli"}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">Dołączył</p>
                <p className="mt-1 text-[11px] text-[var(--bc-muted)]">{formatDate(member.joinedAt)}</p>
              </div>

              {member.isOwner ? <span /> : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Opcje dla ${username}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild><Link href={`/builders/${member.userId}`}>Zobacz profil</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-700 focus:text-red-700 dark:text-red-400" onSelect={() => setSelected(member)}>
                      <UserMinus className="h-4 w-4" /> Usuń z projektu
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
            <DialogTitle>Usunąć osobę z projektu?</DialogTitle>
            <DialogDescription>
              {selected?.profile?.username ?? "Ta osoba"} straci dostęp do prywatnego workspace&apos;u, nowych wiadomości zespołu i zadań projektu.
            </DialogDescription>
          </DialogHeader>
          <div className="border-y border-[var(--bc-line)] py-3 text-[12px] leading-5 text-[var(--bc-muted)]">
            Wcześniejsze wiadomości i historia zmian pozostaną w projekcie, żeby nie usuwać kontekstu pracy pozostałej ekipy. Zadania przypisane tej osobie staną się nieprzypisane.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setSelected(null)}>Anuluj</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmRemoval}>{pending ? "Usuwanie…" : "Usuń z projektu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LeaveProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function confirmLeave() {
    startTransition(async () => {
      const result = await leaveProject(projectId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Opuściłeś projekt ${projectName}.`);
      setOpen(false);
      router.push("/my-projects");
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-[var(--bc-muted)] hover:text-red-700" onClick={() => setOpen(true)}>
        <LogOut className="h-3.5 w-3.5" /> Opuść projekt
      </Button>
      <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opuścić {projectName}?</DialogTitle>
            <DialogDescription>Stracisz dostęp do prywatnego workspace&apos;u projektu i nowych wiadomości zespołu.</DialogDescription>
          </DialogHeader>
          <div className="border-y border-[var(--bc-line)] py-3 text-[12px] leading-5 text-[var(--bc-muted)]">
            Twoje wcześniejsze wiadomości mogą pozostać w historii projektu. Jeśli byłeś przypisany do zadania, zostanie ono bez przypisanej osoby.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Zostań w projekcie</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmLeave}>{pending ? "Opuszczanie…" : "Opuść projekt"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
