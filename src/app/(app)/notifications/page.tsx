import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listNotifications } from "@/server/data/notifications";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Notifications - BuildCrew" : "Powiadomienia - BuildCrew" };
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const en = (await getRequestLocale()) === "en";
  const notifications = await listNotifications(user.id, 100);

  return (
    <div className="mx-auto max-w-5xl">
      <Topbar
        title={en ? "Notifications" : "Powiadomienia"}
        subtitle={en ? "New messages, applications and project activity." : "Nowe wiadomości, zgłoszenia i aktywność projektów."}
      />
      <NotificationsList
        key={notifications.map((n) => `${n.id}:${n.isRead ? 1 : 0}`).join(",")}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
