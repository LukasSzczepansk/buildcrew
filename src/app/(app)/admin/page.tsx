import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BellRing, CheckCircle2, Clock3, ExternalLink, FileQuestion, Flag, FolderKanban, Image as ImageIcon, Mail, UserPlus, UserRoundCheck, Users, UsersRound, XCircle, type LucideIcon } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { AdminStatCard } from "@/components/admin/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/site-server";
import { broadcastPremieryAnnouncementAction, moderateLaunchAction } from "@/server/actions/admin";
import { getAdminOverview } from "@/server/data/admin";
import { listPendingLaunchesForAdmin } from "@/server/data/launches";

export const metadata: Metadata = { title: "Admin - BuildCrew" };

function formatDate(value: Date, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function AdminPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const [data, pendingLaunches] = await Promise.all([
    getAdminOverview(),
    listPendingLaunchesForAdmin(30),
  ]);
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Users} label={en ? "Users" : "Użytkownicy"} value={data.users} helper={en ? `${data.suspendedUsers} suspended` : `${data.suspendedUsers} zawieszonych`} />
        <AdminStatCard icon={FolderKanban} label={en ? "Projects" : "Projekty"} value={data.projects} helper={en ? `${data.applications} project applications` : `${data.applications} aplikacji do projektów`} />
        <AdminStatCard icon={UsersRound} label={en ? "Crews" : "Zespoły"} value={data.crews} helper={en ? "Legacy Build Pool crews" : "Zespoły ze starszego Build Pool"} />
        <AdminStatCard icon={Flag} label={en ? "Open reports" : "Otwarte zgłoszenia"} value={data.openReports} helper={en ? "Need review" : "Wymagają sprawdzenia"} />
        <AdminStatCard icon={ImageIcon} label={en ? "Photos to moderate" : "Zdjęcia do moderacji"} value={data.pendingAvatars} helper={en ? "Not public yet" : "Jeszcze niepubliczne"} />
        <AdminStatCard icon={Clock3} label={en ? "Launches to review" : "Premiery do zatwierdzenia"} value={pendingLaunches.length} helper={en ? "Waiting for moderation" : "Czekają na moderację"} />
        <AdminStatCard icon={FileQuestion} label={en ? "Questions" : "Pytania"} value={data.questions} helper={en ? `${data.answers} answers` : `${data.answers} odpowiedzi`} />
        <AdminStatCard icon={Activity} label={en ? "Product actions / 7 days" : "Akcje w produkcie / 7 dni"} value={data.events7d} helper={en ? "Events recorded in analytics_events" : "Zdarzenia zapisane w analytics_events"} />
      </div>

      <Card className="overflow-hidden border-[var(--bc-line)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--bc-line)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{en ? "Launch moderation" : "Moderacja Premier"}</p>
            <h2 className="mt-1 text-[17px] font-semibold">{en ? "Projects waiting for approval" : "Projekty czekające na zatwierdzenie"}</h2>
            <p className="mt-1 text-[12px] text-[var(--bc-muted)]">
              {en ? "New launches stay private until an administrator approves them." : "Nowe Premiery nie są publiczne, dopóki administrator ich nie zatwierdzi."}
            </p>
          </div>
          <Badge variant={pendingLaunches.length ? "secondary" : "success"}>
            {pendingLaunches.length} {en ? "pending" : "oczekujących"}
          </Badge>
        </div>

        {pendingLaunches.length ? (
          <div className="divide-y divide-[var(--bc-line)]">
            {pendingLaunches.map((launch) => (
              <div key={launch.id} className="p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)_auto] lg:items-start">
                  <div className="overflow-hidden rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)]">
                    {launch.coverImageId ? (
                      <img src={`/api/launches/images/${launch.coverImageId}`} alt="" className="aspect-[4/3] w-full object-cover object-top" />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-[18px] font-semibold text-[var(--bc-faint)]">
                        {launch.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-semibold tracking-[-0.02em]">{launch.title}</h3>
                      <Badge variant="secondary">{en ? "Waiting" : "Oczekuje"}</Badge>
                    </div>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{launch.tagline}</p>
                    <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[var(--bc-faint)]">{launch.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--bc-faint)]">
                      <Avatar username={launch.username} seed={launch.avatarEmoji || launch.creatorId} size="sm" className="h-6 w-6 text-[9px]" />
                      <span className="font-medium text-[var(--bc-ink)]">{launch.username}</span>
                      <span>·</span>
                      <span>{formatDate(launch.createdAt, en)}</span>
                    </div>

                    {launch.technologies.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {launch.technologies.slice(0, 6).map((tech) => (
                          <span key={tech} className="rounded-full border border-[var(--bc-line)] px-2 py-0.5 text-[10px] text-[var(--bc-muted)]">{tech}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={`/launches/${launch.slug}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] border border-[var(--bc-line)] px-3 text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"
                  >
                    {en ? "Preview" : "Podgląd"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <form action={moderateLaunchAction} className="mt-4 flex flex-col gap-3 border-t border-[var(--bc-line)] pt-4 sm:flex-row sm:items-end">
                  <input type="hidden" name="launchId" value={launch.id} />
                  <label className="min-w-0 flex-1">
                    <span className="mb-1.5 block text-[11px] font-medium text-[var(--bc-muted)]">
                      {en ? "Note for creator (optional)" : "Wiadomość dla twórcy (opcjonalnie)"}
                    </span>
                    <input
                      name="note"
                      maxLength={600}
                      placeholder={en ? "Useful especially when rejecting..." : "Przydatne szczególnie przy odrzuceniu..."}
                      className="h-9 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-[12px] outline-none focus:border-[var(--bc-line-strong)]"
                    />
                  </label>
                  <div className="flex shrink-0 gap-2">
                    <ConfirmSubmit
                      type="submit"
                      name="decision"
                      value="reject"
                      variant="outline"
                      className="gap-1.5"
                      message={en ? `Reject "${launch.title}"?` : `Odrzucić „${launch.title}”?`}
                    >
                      <XCircle className="h-4 w-4" />
                      {en ? "Reject" : "Odrzuć"}
                    </ConfirmSubmit>
                    <ConfirmSubmit
                      type="submit"
                      name="decision"
                      value="approve"
                      className="gap-1.5"
                      message={en ? `Approve and publish "${launch.title}"?` : `Zatwierdzić i opublikować „${launch.title}”?`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {en ? "Approve" : "Zatwierdź"}
                    </ConfirmSubmit>
                  </div>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-9 text-center sm:px-6">
            <CheckCircle2 className="mx-auto h-5 w-5 text-[#7ea819]" />
            <p className="mt-2 text-[13px] font-medium">{en ? "Nothing waiting for review" : "Brak Premier do sprawdzenia"}</p>
            <p className="mt-1 text-[12px] text-[var(--bc-faint)]">{en ? "New submissions will appear here." : "Nowe zgłoszenia pojawią się tutaj."}</p>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden border-[var(--bc-line)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--bc-accent-soft)] text-[#7ea819]">
                <BellRing className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{en ? "Community announcement" : "Komunikat do społeczności"}</p>
                <h2 className="mt-0.5 text-[17px] font-semibold">{en ? "Tell everyone about Launches" : "Powiadom wszystkich o Premierach"}</h2>
              </div>
            </div>

            <div className="mt-4 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4">
              <p className="font-semibold">Nowość w BuildCrew - Premiery 🚀</p>
              <p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">
                Masz projekt, aplikację, stronę, grę, SaaS albo coś, nad czym dopiero pracujesz?
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">
                Od teraz możesz pokazać to w <strong className="font-semibold text-[var(--bc-ink)]">Premierach</strong>, zebrać feedback, znaleźć testerów, pierwszych użytkowników albo osoby do dalszej współpracy.
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">Projekt nie musi być skończony ani stworzony na BuildCrew.</p>
              <p className="mt-3 text-[13px] font-semibold text-[var(--bc-ink)]">Pokaż swój projekt →</p>
            </div>

            <p className="mt-3 text-[12px] leading-5 text-[var(--bc-faint)]">
              {en
                ? "Creates an in-app notification for every active account and sends a polished email to verified users with email digests enabled. Repeated clicks do not duplicate notifications or already-sent emails."
                : "Tworzy powiadomienie w aplikacji dla każdego aktywnego konta i wysyła dopracowany e-mail do zweryfikowanych użytkowników z włączonymi podsumowaniami e-mail. Ponowne kliknięcie nie duplikuje powiadomień ani już wysłanych maili."}
            </p>
          </div>

          <form action={broadcastPremieryAnnouncementAction} className="shrink-0">
            <ConfirmSubmit
              type="submit"
              className="gap-2"
              message={en ? "Send the Launches announcement in-app and by email to eligible BuildCrew users?" : "Wysłać informację o Premierach w aplikacji oraz e-mailem do uprawnionych użytkowników BuildCrew?"}
            >
              <Mail className="h-4 w-4" />
              {en ? "Notify + email" : "Powiadom + wyślij e-mail"}
            </ConfirmSubmit>
          </form>
        </div>
      </Card>

      <section className="border-y border-[var(--bc-line)] py-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Collaborations / 7 days" : "Współprace / 7 dni"}</p>
            <h2 className="mt-1 text-[17px] font-semibold">{en ? "Are people actually starting to build together?" : "Czy ludzie faktycznie zaczynają razem budować?"}</h2>
          </div>
          <Link href="/admin/activity" className="hidden text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline">{en ? "Full events" : "Wszystkie zdarzenia"}</Link>
        </div>
        <div className="grid gap-px overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-line)] sm:grid-cols-2 xl:grid-cols-5">
          <FunnelStat icon={Users} value={data.activeUsers7d} label={en ? "active people" : "aktywnych osób"} helper={en ? `+${data.newUsers7d} new accounts` : `+${data.newUsers7d} nowych kont`} />
          <FunnelStat icon={UserPlus} value={data.projectApplications7d} label={en ? "project applications" : "aplikacji do projektów"} helper={en ? "real intent to join" : "realna chęć dołączenia"} />
          <FunnelStat icon={UserRoundCheck} value={data.acceptedApplications7d} label={en ? "team acceptances" : "zaakceptowanych aplikacji"} helper={data.projectApplications7d > 0 ? (en ? `${Math.round((data.acceptedApplications7d / data.projectApplications7d) * 100)}% of applications` : `${Math.round((data.acceptedApplications7d / data.projectApplications7d) * 100)}% aplikacji`) : (en ? "no applications" : "brak aplikacji")} />
          <FunnelStat icon={UsersRound} value={data.teamsFormed7d} label={en ? "new crews" : "nowych zespołów"} helper={en ? "legacy Build Pool + hackathons" : "starszy Build Pool + hackathony"} />
          <FunnelStat icon={CheckCircle2} value={data.completedProjects7d} label={en ? "completed projects" : "ukończonych projektów"} helper={en ? "strongest value signal" : "najmocniejszy sygnał wartości"} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">{en ? "Latest reports" : "Najnowsze zgłoszenia"}</h2>
              <p className="text-[13px] text-neutral-400">{en ? "Moderation priority." : "Priorytet moderacji."}</p>
            </div>
            <Link href="/admin/reports" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">{en ? "View all" : "Zobacz wszystkie"}</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentReports.length ? data.recentReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{report.reported?.username ?? report.reported?.email ?? (en ? "User" : "Użytkownik")}</p>
                  <p className="mt-0.5 truncate text-[13px] text-neutral-500">{report.reason} · {en ? "reported by" : "zgłoszone przez"} {report.reporter?.username ?? (en ? "user" : "użytkownika")}</p>
                </div>
                <div className="text-right">
                  <Badge variant={report.status === "open" ? "destructive" : "secondary"}>{report.status === "open" ? (en ? "open" : "otwarte") : report.status}</Badge>
                  <p className="mt-1 text-[12px] text-neutral-400">{formatDate(report.createdAt, en)}</p>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">{en ? "No reports." : "Brak zgłoszeń."}</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">{en ? "New users" : "Nowi użytkownicy"}</h2>
              <p className="text-[13px] text-neutral-400">{en ? "Recently created accounts." : "Ostatnio utworzone konta."}</p>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">{en ? "Users" : "Użytkownicy"}</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar username={user.username ?? (en ? "No profile" : "Brak profilu")} seed={user.id} size="sm" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{user.username ?? (en ? "No profile" : "Brak profilu")}</p><p className="truncate text-[13px] text-neutral-400">{user.email}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isSuspended ? <Badge variant="destructive">{en ? "Suspended" : "Zawieszony"}</Badge> : <Badge variant="success">{en ? "Active" : "Aktywny"}</Badge>}
                  <span className="text-[12px] text-neutral-400">{formatDate(user.createdAt, en)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 className="font-semibold">{en ? "Recent administrator actions" : "Ostatnie działania administratora"}</h2>
            <p className="text-[13px] text-neutral-400">{en ? "Log of changes made from the admin panel." : "Dziennik zmian wykonanych z panelu administratora."}</p>
          </div>
          <Link href="/admin/activity" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">{en ? "Full log" : "Pełny dziennik"}</Link>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.recentEvents.length ? data.recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <div><span className="font-medium">{event.action}</span> <span className="text-neutral-400">· {event.targetType}</span></div>
              <div className="text-[13px] text-neutral-400">{event.adminEmail ?? "admin"} · {formatDate(event.createdAt, en)}</div>
            </div>
          )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">{en ? "The admin log is still empty." : "Dziennik administratora jest jeszcze pusty."}</p>}
        </div>
      </Card>
    </div>
  );
}

function FunnelStat({ icon: Icon, value, label, helper }: { icon: LucideIcon; value: number; label: string; helper: string }) {
  return (
    <div className="bg-[var(--bc-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-[var(--bc-muted)]" />
        <span className="text-[22px] font-semibold tabular-nums tracking-[-0.03em]">{value}</span>
      </div>
      <p className="mt-3 text-[12px] font-medium text-[var(--bc-ink)]">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">{helper}</p>
    </div>
  );
}
