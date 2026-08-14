import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldBan, ShieldCheck } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAdmin } from "@/lib/auth";
import { ROLE_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { setUserSuspensionAction } from "@/server/actions/admin";
import { listAdminUsers } from "@/server/data/admin";

export const metadata: Metadata = { title: "Użytkownicy — Admin BuildCrew" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const rows = await listAdminUsers(params.q);
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><h2 className="text-xl font-semibold">Użytkownicy</h2><p className="text-sm text-neutral-500">Przegląd kont, aktywności i zgłoszeń. Możesz czasowo zawiesić konto.</p></div>
        <form className="flex w-full max-w-sm gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><Input name="q" defaultValue={params.q} className="pl-9" placeholder="Nick lub e-mail" /></div>
          <Button variant="outline" type="submit">Szukaj</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400 dark:bg-neutral-900/60"><tr>
              <th className="px-5 py-3">Użytkownik</th><th className="px-4 py-3">Rola</th><th className="px-4 py-3">Projekty</th><th className="px-4 py-3">Zgłoszenia</th><th className="px-4 py-3">Raporty</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Akcje</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {rows.map((user) => {
                const adminAccount = isAdmin(user.email, user.systemRole);
                return <tr key={user.id} className="align-top hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                  <td className="px-5 py-4"><div className="flex gap-3"><Avatar username={user.username ?? "Nieukończony profil"} seed={user.id} size="sm" /><div><Link href={`/builders/${user.id}`} className="font-medium hover:text-lime-600">{user.username ?? "Nieukończony profil"}</Link><p className="text-xs text-neutral-400">{user.email}</p>{!user.onboardingCompleted ? <Badge variant="warning" className="mt-1">Onboarding nieukończony</Badge> : null}</div></div></td>
                  <td className="px-4 py-4"><p>{user.role ? ROLE_LABELS[user.role] : "—"}</p><p className="text-xs text-neutral-400">{user.level ? LEVEL_LABELS[user.level] : "Brak poziomu"}</p></td>
                  <td className="px-4 py-4"><p>{user.ownedProjects} własnych</p><p className="text-xs text-neutral-400">{user.projectMemberships} członkostw</p></td>
                  <td className="px-4 py-4">{user.applications}</td>
                  <td className="px-4 py-4">{user.reportsReceived ? <Badge variant="destructive">{user.reportsReceived}</Badge> : <span className="text-neutral-400">0</span>}</td>
                  <td className="px-4 py-4">{adminAccount ? <Badge>Administrator</Badge> : user.isSuspended ? <><Badge variant="destructive">Zawieszony</Badge><p className="mt-1 max-w-[180px] text-xs text-neutral-400">{user.suspendedReason}</p></> : <Badge variant="success">Aktywny</Badge>}</td>
                  <td className="px-5 py-4 text-right">
                    {!adminAccount && (user.isSuspended ? (
                      <form action={setUserSuspensionAction}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="mode" value="restore"/><ConfirmSubmit message="Przywrócić dostęp temu użytkownikowi?" variant="outline" size="sm"><ShieldCheck className="h-3.5 w-3.5"/> Przywróć</ConfirmSubmit></form>
                    ) : (
                      <form action={setUserSuspensionAction} className="ml-auto flex max-w-[330px] items-center justify-end gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="mode" value="suspend"/><Input name="reason" placeholder="Powód zawieszenia" className="h-8 min-w-[170px] text-xs"/><ConfirmSubmit message="Zawiesić konto? Użytkownik zostanie natychmiast wylogowany." variant="destructive" size="sm"><ShieldBan className="h-3.5 w-3.5"/> Zawieś</ConfirmSubmit></form>
                    ))}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {!rows.length ? <p className="p-10 text-center text-sm text-neutral-400">Brak użytkowników pasujących do wyszukiwania.</p> : null}
      </Card>
    </div>
  );
}
