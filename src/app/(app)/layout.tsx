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
    <div className="flex min-h-screen bg-[#f4f4ef] dark:bg-[#11110f]">
      <Sidebar username={user.username ?? "Builder"} avatarEmoji={user.avatarEmoji} admin={isAdmin(user.email, user.systemRole)} unreadMessages={unreadMessages} />
      <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-7 sm:py-7 lg:px-10 lg:py-8 lg:pb-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
}
