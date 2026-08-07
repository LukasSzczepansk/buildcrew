import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { unreadMessagesCount } from "@/server/data/messages";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (!user.onboardingCompleted) redirect("/onboarding");
  const unreadMessages = await unreadMessagesCount(user.id);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar username={user.username ?? "Builder"} avatarEmoji={user.avatarEmoji} admin={isAdmin(user.email, user.systemRole)} unreadMessages={unreadMessages} />
      <main className="flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
}
