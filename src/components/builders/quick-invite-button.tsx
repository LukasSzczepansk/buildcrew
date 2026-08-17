"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inviteToProject } from "@/server/actions/projects";

export function QuickInviteButton({ targetUserId, projects }: { targetUserId: string; projects: { id: string; name: string }[] }) {
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
      toast.error(result.error);
      return;
    }
    toast.success("Invitation sent.");
    setMessage("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" />Invite</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to a project</DialogTitle>
          <DialogDescription>Choose the project where this person could be a strong fit. Add context so the invitation feels personal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
            <SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} placeholder="I think your experience could be a strong fit because…" />
        </div>
        <DialogFooter><Button onClick={submit} disabled={pending || !projectId}>{pending ? "Sending…" : "Send invitation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
