import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LegalFooter } from "@/components/layout/legal-footer";
import { LaunchesHeader } from "@/components/launches/launches-header";
import { getCurrentUser, isAdmin, isFounder } from "@/lib/auth";
import { unreadMessagesCount } from "@/server/data/messages";

export default async function LaunchesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.emailVerified || !user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
        <LaunchesHeader />
        <main className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
      </div>
    );
  }

  const unreadMessages = await unreadMessagesCount(user.id);

  return (
    <div className="flex min-h-screen bg-[var(--bc-canvas)]">
      <Sidebar
        username={user.username ?? "Builder"}
        avatarEmoji={user.avatarEmoji}
        admin={isAdmin(user.email, user.systemRole)}
        founder={isFounder(user.email, user.systemRole)}
        unreadMessages={unreadMessages}
      />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col px-4 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8 lg:py-7 lg:pb-10 xl:px-9">
        <div className="mx-auto w-full max-w-[1320px] flex-1">{children}</div>
        <LegalFooter className="mx-auto mt-10 w-full max-w-[1320px]" />
      </main>
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
}
