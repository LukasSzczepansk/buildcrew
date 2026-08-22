import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  if (!user) redirect("/login");
  if (!isAdmin(user.email, user.systemRole)) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-lime-600 dark:text-lime-400">
            <ShieldCheck className="h-4 w-4" />
            {en ? "BuildCrew administration" : "Administracja BuildCrew"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{en ? "Admin panel" : "Panel administratora"}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{en ? "Users, projects, reports, content, and moderation actions in one place." : "Użytkownicy, projekty, zgłoszenia, treści i moderacja w jednym miejscu."}</p>
        </div>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
