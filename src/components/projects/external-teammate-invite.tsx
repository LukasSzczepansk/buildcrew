"use client";

import * as React from "react";
import { MailPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import type { RoleType } from "@/db/schema";
import { sendExternalProjectInvite } from "@/server/actions/external-invites";

export function ExternalTeammateInvite({ projectId, roles }: { projectId: string; roles: { id: string; roleType: RoleType }[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const labels = labelsFor(locale);
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [roleId, setRoleId] = React.useState("__none");
  const [pending, startTransition] = React.useTransition();
  function submit() {
    startTransition(async () => {
      const result = await sendExternalProjectInvite({ projectId, roleId: roleId === "__none" ? undefined : roleId, email, message });
      if (result?.error) { toast.error(result.error); return; }
      toast.success(copy("Zaproszenie wysłane e-mailem.", "Invitation sent by email."));
      setEmail(""); setMessage("");
    });
  }
  return (
    <section className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4">
      <div className="flex items-start gap-2"><MailPlus className="mt-0.5 h-4 w-4 text-[var(--bc-muted)]" /><div><p className="text-[13px] font-semibold">{copy("Zaproś osobę spoza BuildCrew", "Invite someone outside BuildCrew")}</p><p className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">{copy("Wyślemy bezpieczny link do projektu. Zaproszenie wygasa po 14 dniach.", "We will send a secure project link. The invitation expires after 14 days.")}</p></div></div>
      <div className="mt-4 space-y-2.5">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        {roles.length ? <Select value={roleId} onValueChange={setRoleId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">{copy("Dowolna rola", "Any role")}</SelectItem>{roles.map((role) => <SelectItem key={role.id} value={role.id}>{labels.roles[role.roleType]}</SelectItem>)}</SelectContent></Select> : null}
        <Textarea value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder={copy("Krótka, osobista wiadomość (opcjonalnie)", "Short personal note (optional)")} />
        <Button size="sm" onClick={submit} disabled={pending || !email.includes("@")} className="w-full">{pending ? copy("Wysyłanie…", "Sending…") : copy("Wyślij zaproszenie", "Send invitation")}</Button>
      </div>
    </section>
  );
}
