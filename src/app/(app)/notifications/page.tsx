import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { timeAgo } from "@/lib/utils";
import { listNotifications } from "@/server/data/notifications";
export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Notifications - BuildCrew" : "Powiadomienia - BuildCrew" }; }
export default async function NotificationsPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); const locale = await getRequestLocale(); const en = locale === "en"; const notifications = await listNotifications(user.id, 100); return <div className="mx-auto max-w-5xl"><Topbar title={en ? "Notifications" : "Powiadomienia"} subtitle={en ? "New messages, applications and project activity." : "Nowe wiadomości, zgłoszenia i zmiany w projektach."} />{notifications.length ? <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{notifications.map((notification) => <Link key={notification.id} href={notification.link ?? "/dashboard"} className={`flex gap-3 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-2 ${notification.isRead ? "opacity-65" : ""}`}><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-[var(--bc-line-strong)]" : "bg-[var(--bc-accent-strong)]"}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{notification.title}</span>{notification.body ? <span className="mt-1 line-clamp-2 block text-sm text-[var(--bc-muted)]">{notification.body}</span> : null}<span className="mt-1 block text-[12px] text-[var(--bc-faint)]">{timeAgo(notification.createdAt.toISOString(), locale)}</span></span><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bc-faint)]" /></Link>)}</div> : <p className="border-y border-[var(--bc-line)] py-10 text-center text-sm text-[var(--bc-muted)]">{en ? "No notifications." : "Brak powiadomień."}</p>}</div>; }
