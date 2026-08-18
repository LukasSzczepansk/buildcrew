"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { inviteToProject } from "@/server/actions/projects";

export function QuickInviteButton({ targetUserId, projects }: { targetUserId: string; projects: { id: string; name: string }[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  if (!projects.length) return null;

  async function submit() {
    if (!projectId || pending) return;
    setPending(true);
    const result = await inviteToProject(projectId, targetUserId, undefined, message);
    setPending(false);
    if (result && "error" in result && result.error) {
      toast.error(appMessage(result.error, locale));
      return;
    }
    toast.success(copy("Zaproszenie wysłane.", "Invitation sent."));
    setMessage("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" />{copy("Zaproś", "Invite")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy("Zaproś do projektu", "Invite to a project")}</DialogTitle>
          <DialogDescription>{copy("Wybierz projekt, do którego ta osoba może dobrze pasować. Dodaj krótki kontekst, żeby zaproszenie było bardziej osobiste.", "Choose the project where this person could be a strong fit. Add context so the invitation feels personal.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder={copy("Wybierz projekt", "Choose project")} /></SelectTrigger>
            <SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} placeholder={copy("Myślę, że Twoje doświadczenie może dobrze pasować, ponieważ...", "I think your experience could be a strong fit because...")} />
        </div>
        <DialogFooter><Button onClick={submit} disabled={pending || !projectId}>{pending ? copy("Wysyłanie...", "Sending...") : copy("Wyślij zaproszenie", "Send invitation")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
