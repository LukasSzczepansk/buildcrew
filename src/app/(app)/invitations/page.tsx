import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, Sparkles, Users, Rocket } from "lucide-react";
import { InvitationActions } from "@/components/invitations/invitation-actions";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { listPendingInvitations } from "@/server/data/invitations";

export const metadata: Metadata = { title: "Zaproszenia — BuildCrew" };

export default async function InvitationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pending = await listPendingInvitations(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Topbar title="Zaproszenia" subtitle="Tutaj akceptujesz propozycje ekip i projektów." />

      {pending.count === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="mx-auto h-9 w-9 text-neutral-300" />
          <h2 className="mt-4 font-semibold">Nie masz oczekujących zaproszeń</h2>
          <p className="mt-1 text-sm text-neutral-500">Znajdź ludzi w Build Pool albo przejrzyj projekty.</p>
          <div className="mt-5 flex justify-center gap-2 text-sm">
            <Link href="/build" className="font-medium text-violet-600 hover:underline">Build Pool</Link>
            <span className="text-neutral-300">·</span>
            <Link href="/projects" className="font-medium text-violet-600 hover:underline">Projekty</Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.buildProposals.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar emoji={item.senderAvatar} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /><p className="font-semibold">{item.senderUsername} chce coś z Tobą zbudować</p></div>
                  <p className="mt-1 text-sm text-neutral-500">{item.senderRole ? ROLE_LABELS[item.senderRole] : "Builder"} · {timeAgo(item.createdAt)}</p>
                  {item.message && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">„{item.message}”</p>}
                </div>
                <InvitationActions type="BUILD_PROPOSAL" id={item.id} />
              </div>
            </Card>
          ))}

          {pending.crewInvites.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar emoji={item.inviterAvatar} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-600" /><p className="font-semibold">{item.inviterUsername} zaprasza Cię do ekipy</p></div>
                  <p className="mt-1 text-sm text-neutral-500">{timeAgo(item.createdAt)}</p>
                  {item.message && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">„{item.message}”</p>}
                </div>
                <InvitationActions type="CREW_INVITE" id={item.id} crewId={item.crewId} />
              </div>
            </Card>
          ))}

          {pending.projectInvites.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar emoji={item.inviterAvatar} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Rocket className="h-4 w-4 text-violet-600" /><p className="font-semibold">Zaproszenie do {item.projectName}</p></div>
                  <p className="mt-1 text-sm text-neutral-500">Od {item.inviterUsername} · {timeAgo(item.createdAt)}</p>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{item.projectTagline}</p>
                  {item.message && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">„{item.message}”</p>}
                </div>
                <InvitationActions type="PROJECT_INVITE" id={item.id} projectId={item.projectId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
