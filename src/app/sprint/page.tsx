import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Lightbulb,
  Palette,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getChallengeParticipation, listChallenges } from "@/server/data/showcase";
import type { RoleType } from "@/db/schema";
import { getSprintPublicStats } from "@/server/data/sprints";

export const metadata: Metadata = {
  title: "BuildCrew Sprint - 30 dni, jedna ekipa, działający produkt",
  description: "Dołącz do BuildCrew Sprint. Dobierz ekipę i w 30 dni zbuduj działający produkt, który pokażecie na Demo Day.",
};

export default async function SprintPage() {
  const [locale, user, challenges] = await Promise.all([getRequestLocale(), getCurrentUser(), listChallenges()]);
  const en = locale === "en";
  const c = <T,>(pl: T, english: T): T => (en ? english : pl);
  const activeSprint = challenges.find((item) => item.status === "OPEN" || item.status === "BUILDING") ?? challenges[0] ?? null;
  const stats = activeSprint ? await getSprintPublicStats(activeSprint.id) : { total: 0, accepted: 0, matched: 0, roleCounts: {} as Partial<Record<RoleType, number>> };
  const participation = activeSprint && user?.emailVerified && user.onboardingCompleted
    ? await getChallengeParticipation(activeSprint.id, user.id)
    : null;

  const settings = activeSprint?.settings ?? {};
  const capacity = settings.capacity ?? 40;
  const remaining = Math.max(0, capacity - stats.total);
  const hasApplications = stats.total > 0;
  const applicationsOpen = !activeSprint || activeSprint.status === "OPEN";
  const socialProofTitle = applicationsOpen
    ? c("🔥 Pierwsze zgłoszenia już wpadają", "🔥 First applications are coming in")
    : activeSprint?.status === "BUILDING"
      ? c("🚀 Crew już budują", "🚀 Crews are already building")
      : c("✨ Pierwsza edycja BuildCrew Sprint", "✨ First BuildCrew Sprint edition");
  const socialProofMeta = applicationsOpen
    ? c(`${capacity} miejsc · nabór otwarty`, `${capacity} seats · applications open`)
    : stats.total > 0
      ? c(`${stats.total} uczestników`, `${stats.total} participants`)
      : c("Śledź kolejną edycję", "Follow the next edition");
  const applicationsCloseAt = settings.applicationsCloseAt ? new Date(settings.applicationsCloseAt) : activeSprint?.startsAt ?? null;
  const daysLeft = applicationsCloseAt ? Math.max(0, Math.ceil((applicationsCloseAt.getTime() - Date.now()) / 86400000)) : null;
  const start = activeSprint ? formatDate(activeSprint.startsAt, locale) : c("Wkrótce", "Soon");
  const end = activeSprint ? formatDate(activeSprint.endsAt, locale) : c("30 dni później", "30 days later");
  const teamReveal = settings.teamRevealAt ? formatDate(new Date(settings.teamRevealAt), locale) : start;
  const demoDay = settings.demoDayAt ? formatDate(new Date(settings.demoDayAt), locale) : end;

  const signupHref = `/signup?next=${encodeURIComponent("/sprint/apply")}`;
  const applicationHref = !user
    ? signupHref
    : !user.emailVerified
      ? "/verify-email"
      : !user.onboardingCompleted
        ? "/onboarding"
        : "/sprint/apply";
  const applicationLabel = participation?.applicationData
    ? c("Zobacz moje zgłoszenie", "View my application")
    : c("Zgłoś się do Sprintu", "Apply to the Sprint");

  const statusLabel = !activeSprint
    ? c("Pierwsza edycja wkrótce", "First edition coming soon")
    : activeSprint.status === "OPEN"
      ? c("Zgłoszenia otwarte", "Applications open")
      : activeSprint.status === "BUILDING"
        ? c("Sprint trwa", "Sprint in progress")
        : activeSprint.status === "VOTING"
          ? "Demo Day"
          : c("Edycja zakończona", "Edition completed");

  return (
    <div className="min-h-screen bg-[#f4f4ef] pb-20 text-[#111111] md:pb-0 dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <AnalyticsEvent name="sprint_view" params={{ locale, status: activeSprint?.status ?? "none" }} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href={user?.onboardingCompleted ? "/dashboard" : "/"} className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew</Link>
          <div className="flex items-center gap-1.5"><LanguageSwitcher compact /><Button asChild variant="ghost" size="sm"><Link href={user?.onboardingCompleted ? "/dashboard" : "/"}>{c("Wróć do BuildCrew", "Back to BuildCrew")}</Link></Button></div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#d8d8d0] dark:border-[#34342f]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end lg:px-10 lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#a8cf45] bg-[#c8f169] px-3 py-1 text-[12px] font-semibold text-neutral-950"><Rocket className="h-3.5 w-3.5" />{statusLabel}</div>
              <p className="mt-6 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">BuildCrew Sprint #1</p>
              <h1 className="mt-3 max-w-[820px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px]">{c("30 dni. Jedna ekipa. Jeden działający produkt.", "30 days. One crew. One working product.")}</h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">{c("Nie musisz mieć gotowego zespołu ani perfekcyjnego pomysłu. Zgłaszasz rolę, stack i dostępność, a BuildCrew pomaga dobrać Crew i przejść od pomysłu do produktu, który naprawdę działa.", "You do not need a ready-made team or a perfect idea. Share your role, stack and availability, then BuildCrew helps match a Crew and move from idea to a product that actually works.")}</p>
              <div className="mt-7 flex flex-wrap gap-2"><Button asChild size="lg" className="bg-[#c8f169] text-neutral-950 shadow-sm hover:bg-[#b8df5b]"><Link href={applicationHref}>{applicationLabel}<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><a href="#how-it-works">{c("Jak to działa", "How it works")}</a></Button></div>
              <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{c("Zgłoszenie zajmuje około 2-3 minut.", "The application takes about 2-3 minutes.")}</p>
              <div className="mt-4 inline-flex min-w-[270px] flex-col rounded-xl border border-[#b7d85b] bg-[#eef6d6] px-4 py-3 text-left dark:border-lime-400/30 dark:bg-lime-400/10">
                <span className="text-sm font-semibold text-[#536b0c] dark:text-lime-200">{socialProofTitle}</span>
                <span className="mt-0.5 text-xs font-medium text-[#6f7f42] dark:text-lime-100/70">{socialProofMeta}</span>
              </div>
            </div>

            <Card className="overflow-hidden bg-white dark:bg-[#171715]">
              <div className="border-b border-[var(--bc-line)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-400">{c("Aktualna edycja", "Current edition")}</p><h2 className="mt-2 text-xl font-semibold">{activeSprint?.title ?? "BuildCrew Sprint #1"}</h2></div><Sparkles className="h-5 w-5 text-[#8eb51f]" /></div><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{activeSprint?.prompt ?? c("Zbierz ekipę i wypuść działający produkt w 30 dni.", "Build a crew and ship a working product in 30 days.")}</p></div>
              <div className="grid grid-cols-2 gap-px bg-[var(--bc-line)]"><Stat icon={CalendarDays} label={c("Start", "Start")} value={start} /><Stat icon={Users} label={c("Zgłoszenia", "Applications")} value={hasApplications ? `${stats.total}/${capacity}` : c("Nabór trwa", "Recruiting")} /><Stat icon={Sparkles} label="Team Reveal" value={teamReveal} /><Stat icon={Rocket} label="Demo Day" value={demoDay} /></div>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs"><span className="font-medium">{c("Miejsca", "Seats")}</span><span className="text-neutral-500">{hasApplications ? (remaining > 0 ? c(`${remaining} wolnych`, `${remaining} left`) : c("Lista pełna", "Full")) : c(`${capacity} miejsc w pierwszej edycji`, `${capacity} seats in the first edition`)}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-[#c8f169]" style={{ width: `${Math.min(100, Math.round((stats.total / capacity) * 100))}%` }} /></div>
                {daysLeft !== null ? <p className="mt-3 text-xs text-neutral-500">{daysLeft > 0 ? c(`Zgłoszenia zamykamy za ${daysLeft} dni.`, `Applications close in ${daysLeft} days.`) : c("Termin zgłoszeń jest blisko lub już minął.", "The application deadline is close or has passed.")}</p> : null}
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RoleCard icon={Code2} title={c("Programista", "Developer")} text={c("Masz dość tutorialowych projektów? Zbuduj coś z backendem, designem i realnym zespołem.", "Done with tutorial projects? Build something with backend, design and a real team.")} count={(stats.roleCounts.FRONTEND ?? 0) + (stats.roleCounts.BACKEND ?? 0) + (stats.roleCounts.FULLSTACK ?? 0) + (stats.roleCounts.MOBILE ?? 0)} countLabel={c("zgłoszeń", "applications")} emptyLabel={c("Nabór otwarty", "Recruiting")} />
            <RoleCard icon={Palette} title="UX/UI" text={c("Projektujesz dobre rzeczy, ale brakuje Ci developerów, którzy je wdrożą? Tu ich znajdziesz.", "Design good products but lack developers to implement them? Find them here.")} count={stats.roleCounts.UI_UX ?? 0} countLabel={c("zgłoszeń", "applications")} emptyLabel={c("Nabór otwarty", "Recruiting")} />
            <RoleCard icon={Lightbulb} title={c("Product / Founder", "Product / Founder")} text={c("Masz pomysł, ale nie masz kompletnej ekipy? Sprint pomoże domknąć brakujące role.", "Have an idea but not a complete team? Sprint helps fill the missing roles.")} count={stats.roleCounts.PRODUCT ?? 0} countLabel={c("zgłoszeń", "applications")} emptyLabel={c("Nabór otwarty", "Recruiting")} />
            <RoleCard icon={TrendingUp} title="Growth / Marketing" text={c("Chcesz pracować przy produkcie, który naprawdę powstaje, a nie przy fikcyjnym case study.", "Work on a product that is actually being built, not a fictional case study.")} count={stats.roleCounts.MARKETING ?? 0} countLabel={c("zgłoszeń", "applications")} emptyLabel={c("Nabór otwarty", "Recruiting")} />
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
            <p className="text-[13px] font-medium text-neutral-500">{c("Jak działa Sprint", "How Sprint works")}</p><h2 className="mt-2 max-w-2xl text-[32px] font-semibold tracking-[-0.03em]">{c("Od zgłoszenia do działającego produktu.", "From application to a working product.")}</h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-[8px] border border-[#d8d8d0] bg-[#d8d8d0] md:grid-cols-2 lg:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-700"><Step number="01" title={c("Zgłaszasz się", "Apply")} text={c("Rola, stack, dostępność i to, czego chcesz zbudować.", "Your role, stack, availability and what you want to build.")} /><Step number="02" title={c("Dobieramy Crew", "Match a Crew")} text={c("Łączymy komplementarne role i osoby o podobnym tempie pracy.", "We combine complementary roles and compatible working pace.")} /><Step number="03" title={c("Budujecie 30 dni", "Build for 30 days")} text={c("Mały scope, regularny progres i jeden konkretny cel do dowiezienia.", "Small scope, regular progress and one concrete goal to ship.")} /><Step number="04" title="Demo Day" text={c("Pokazujecie działający produkt i zachowujecie proof of work na profilach.", "Show a working product and keep proof of work on your profiles.")} /></div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10">
          <div>
            <p className="text-[13px] font-medium text-neutral-500">{c("Rezultat", "Outcome")}</p><h2 className="mt-2 text-[32px] font-semibold tracking-[-0.03em]">{c("Co masz po 30 dniach?", "What do you have after 30 days?")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Check text={c("Działający produkt", "A working product")} /><Check text={c("Realną współpracę zespołową", "Real team collaboration")} /><Check text={c("Projekt do portfolio", "A portfolio project")} /><Check text={c("Ludzi, z którymi naprawdę pracowałeś", "People you actually built with")} /><Check text={c("Potwierdzony wkład w projekt", "Verified project contribution")} /><Check text={c("Produkt, który możecie rozwijać dalej", "A product you can continue after Sprint")} /></div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{c("Nie chodzi o samo uczestnictwo. Celem jest dowiezienie czegoś, co naprawdę możesz pokazać i o czym możesz opowiedzieć podczas rekrutacji, rozmowy z klientem albo kolejnego projektu.", "This is not about a participation badge. The goal is to ship something you can genuinely show and talk about in recruitment, with clients or in your next project.")}</p>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--bc-line)] p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{c("Przykładowa Crew", "Example Crew")}</p><div className="mt-3 flex items-baseline justify-between"><h3 className="text-xl font-semibold">SaaS Crew</h3><span className="rounded-full bg-[#c8f169] px-2.5 py-1 text-xs font-semibold text-neutral-950">87% match</span></div></div>
            <div className="divide-y divide-[var(--bc-line)]"><CrewRow emoji="💻" role="Frontend" detail="React / Next.js" /><CrewRow emoji="⚙️" role="Backend" detail="Node / PostgreSQL" /><CrewRow emoji="🎨" role="UX/UI" detail="Figma / Research" /><CrewRow emoji="📈" role="Growth" detail="Launch / Marketing" /></div>
            <div className="bg-neutral-50 p-5 text-sm text-neutral-500 dark:bg-neutral-900/60">SaaS · 5-8h / tydzień · wieczory · cel: {c("wypuścić działający produkt", "ship a working product")}</div>
          </Card>
        </section>

        <section className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10"><p className="text-[13px] font-medium text-neutral-500">{c("Nie musisz zaczynać tak samo", "Two ways to join")}</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">{c("Masz pomysł czy szukasz projektu?", "Have an idea or looking for a project?")}</h2><div className="mt-7 grid gap-3 md:grid-cols-2"><PathCard icon={Lightbulb} title={c("Mam pomysł", "I have an idea")} text={c("Opisz go w zgłoszeniu. Dobierzemy osoby, których potrzebujesz do zbudowania pierwszej działającej wersji.", "Describe it in your application. We will help match the roles you need to build the first working version.")} href={applicationHref} action={c("Zgłoś pomysł", "Apply with an idea")} /><PathCard icon={Users} title={c("Nie mam pomysłu", "I do not have an idea")} text={c("Dołącz jako specjalista do osoby, która ma kierunek, ale potrzebuje Twojej roli i umiejętności.", "Join as a specialist someone who has direction but needs your role and skills.")} href={applicationHref} action={c("Znajdź Crew", "Find a Crew")} /></div></div>
        </section>

        <section className="mx-auto max-w-[900px] px-5 py-14 sm:px-8"><p className="text-[13px] font-medium text-neutral-500">FAQ</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">{c("Najczęstsze pytania", "Common questions")}</h2><div className="mt-6 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]"><Faq q={c("Czy muszę być doświadczony?", "Do I need to be experienced?")} a={c("Nie. Ważniejsza jest realna dostępność, chęć pracy w zespole i umiejętności, które możesz wnieść do projektu.", "No. Real availability, willingness to work in a team and useful skills matter more.")} /><Faq q={c("Czy muszę mieć własny pomysł?", "Do I need my own idea?")} a={c("Nie. Możesz zaznaczyć, że chcesz dołączyć do czyjegoś projektu.", "No. You can apply to join someone else's project.")} /><Faq q={c("Ile czasu trzeba poświęcić?", "How much time does it take?")} a={c("W zgłoszeniu podajesz realną dostępność. Matching stara się łączyć osoby o podobnym tempie i oczekiwaniach.", "You declare realistic availability in the application. Matching tries to combine people with compatible pace and expectations.")} /><Faq q={c("Co jeśli Crew ma problem w trakcie Sprintu?", "What if the Crew has a problem during Sprint?")} a={c("Cotygodniowy check-in pozwala szybko zgłosić, że zespół potrzebuje pomocy. Admin widzi takie sygnały i może zareagować.", "A weekly check-in lets the team flag problems quickly. Admin can see those signals and react.")} /></div></section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:px-10"><div><p className="text-[13px] text-neutral-400">BuildCrew Sprint</p><h2 className="mt-3 max-w-2xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">{c("Za 30 dni możesz nadal mieć pomysł. Albo działający produkt i ludzi, z którymi go zbudowałeś.", "In 30 days you can still have an idea. Or a working product and people you built it with.")}</h2></div><Button asChild size="lg" className="bg-[#c8f169] text-neutral-950 hover:bg-[#b8df5b]"><Link href={applicationHref}>{applicationLabel}<ArrowRight className="h-4 w-4" /></Link></Button></div></section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f4f4ef]/95 p-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#11110f]/95"><Button asChild size="lg" className="w-full bg-[#c8f169] text-neutral-950 shadow-lg hover:bg-[#b8df5b]"><Link href={applicationHref}>{applicationLabel}<ArrowRight className="h-4 w-4" /></Link></Button></div>
    </div>
  );
}

function formatDate(value: Date, locale: "pl" | "en") { return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(value); }
function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="bg-white p-4 dark:bg-[#171715]"><div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400"><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-2 text-sm font-semibold">{value}</p></div>; }
function RoleCard({ icon: Icon, title, text, count, countLabel, emptyLabel }: { icon: LucideIcon; title: string; text: string; count: number; countLabel: string; emptyLabel: string }) { return <Card className="p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef6d6] text-[#66820f] dark:bg-lime-400/10 dark:text-lime-300"><Icon className="h-5 w-5" /></span><span className="text-xs font-medium text-neutral-400">{count > 0 ? `${count} ${countLabel}` : emptyLabel}</span></div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></Card>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="bg-white p-5 dark:bg-[#171715]"><p className="text-[11px] font-semibold text-neutral-400">{number}</p><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></div>; }
function Check({ text }: { text: string }) { return <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#8eb51f]" /><span>{text}</span></div>; }
function CrewRow({ emoji, role, detail }: { emoji: string; role: string; detail: string }) { return <div className="flex items-center gap-3 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">{emoji}</span><div><p className="text-sm font-semibold">{role}</p><p className="text-xs text-neutral-500">{detail}</p></div></div>; }
function PathCard({ icon: Icon, title, text, href, action }: { icon: LucideIcon; title: string; text: string; href: string; action: string }) { return <Card className="p-6"><Icon className="h-6 w-6 text-[#7c9f14]" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p><Button asChild className="mt-5"><Link href={href}>{action}<ArrowRight className="h-4 w-4" /></Link></Button></Card>; }
function Faq({ q, a }: { q: string; a: string }) { return <div className="py-5"><h3 className="font-semibold">{q}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{a}</p></div>; }
