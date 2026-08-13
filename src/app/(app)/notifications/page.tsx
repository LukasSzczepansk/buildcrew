import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import { listNotifications } from "@/server/data/notifications";

export const metadata: Metadata = { title: "Powiadomienia — BuildCrew" };
export default async function NotificationsPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); const notifications = await listNotifications(user.id, 100); return <div><Topbar title="Powiadomienia" subtitle="Zgłoszenia do projektów, Build Pool, Crew, Showcase i Build Challenges w jednym miejscu." /><div className="space-y-2">{notifications.map((notification) => <Card key={notification.id} className={`p-4 ${notification.isRead ? "opacity-65" : "border-lime-200 dark:border-lime-500/20"}`}><Link href={notification.link ?? "/dashboard"} className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[6px] bg-lime-50 text-lime-600 dark:bg-lime-500/10"><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{notification.title}</span>{notification.body ? <span className="mt-1 block text-sm text-neutral-500">{notification.body}</span> : null}<span className="mt-1 block text-xs text-neutral-400">{timeAgo(notification.createdAt.toISOString())}{notification.emailSentAt ? " · wysłano też e-mail" : ""}</span></span></Link></Card>)}{!notifications.length ? <p className="py-16 text-center text-sm text-neutral-400">Brak powiadomień.</p> : null}</div></div>; }
