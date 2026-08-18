import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Rocket, Sparkles, Users, type LucideIcon } from "lucide-react";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { ChallengeJoinPanel } from "@/components/challenges/challenge-join-panel";
import { ChallengeMatchCard } from "@/components/challenges/challenge-match-card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getCrewById, getMembershipCrewForUser } from "@/server/data/crews";
import { getProfileByUserId } from "@/server/data/profiles";
import { getChallengeParticipantCount, getChallengeParticipation, listChallengeMatches, listChallenges } from "@/server/data/showcase";

export const metadata: Metadata = {
  title: "BuildCrew Sprint - 30 dni, jedna ekipa, działający projekt",
  description: "Dołącz do BuildCrew Sprint. Dobierz ekipę, zbuduj realny projekt w 30 dni i zakończ program Demo Dayem oraz proof of work na profilu.",
};

export default async function SprintPage() {
  const [locale, user, challenges] = await Promise.all([getRequestLocale(), getCurrentUser(), listChallenges()]);
  const en = locale === "en";
  const c = <T,>(pl: T, english: T): T => (en ? english : pl);
  const activeSprint = challenges.find((item) => item.status === "OPEN" || item.status === "BUILDING") ?? challenges[0] ?? null;

  let participantCount = 0;
  let participation: Awaited<ReturnType<typeof getChallengeParticipation>> = null;
  let profileDefaults: Awaited<ReturnType<typeof getProfileByUserId>> = null;
  let crews: { id: string; label: string }[] = [];
  let matches: Awaited<ReturnType<typeof listChallengeMatches>> = [];

  if (activeSprint) {
    participantCount = await getChallengeParticipantCount(activeSprint.id);
    if (user?.emailVerified && user.onboardingCompleted) {
      [participation, profileDefaults] = await Promise.all([
        getChallengeParticipation(activeSprint.id, user.id),
        getProfileByUserId(user.id),
      ]);
      const crewId = await getMembershipCrewForUser(user.id);
      if (crewId) {
        const crew = await getCrewById(crewId);
        if (crew) crews = [{ id: crew.id, label: `Crew ${crew.id.slice(0, 8)}` }];
      }
      if (participation?.mode === "FIND_CREW") matches = await listChallengeMatches(activeSprint.id, user.id, locale);
    }
  }

  const start = activeSprint ? formatDate(activeSprint.startsAt, locale) : null;
  const end = activeSprint ? formatDate(activeSprint.endsAt, locale) : null;
  const statusLabel = !activeSprint
    ? c("Pierwsza edycja wkrótce", "First edition coming soon")
    : activeSprint.status === "OPEN"
      ? c("Zapisy otwarte", "Applications open")
      : activeSprint.status === "BUILDING"
        ? c("Sprint trwa", "Sprint in progress")
        : activeSprint.status === "VOTING"
          ? "Demo Day"
          : c("Edycja zakończona", "Edition completed");

  const signupHref = `/signup?next=${encodeURIComponent("/sprint")}`;
  const loginHref = `/login?next=${encodeURIComponent("/sprint")}`;

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <AnalyticsEvent name="sprint_view" params={{ locale, status: activeSprint?.status ?? "none" }} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href={user?.onboardingCompleted ? "/dashboard" : "/"} className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew</Link>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            {user ? <Button asChild variant="ghost" size="sm"><Link href={user.onboardingCompleted ? "/dashboard" : "/onboarding"}>{c("Wróć do BuildCrew", "Back to BuildCrew")}</Link></Button> : <Button asChild variant="ghost" size="sm"><Link href={loginHref}>{c("Zaloguj się", "Log in")}</Link></Button>}
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#d8d8d0] dark:border-[#34342f]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:px-10 lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#a8cf45] bg-[#c8f169] px-3 py-1 text-[12px] font-semibold text-neutral-950"><Rocket className="h-3.5 w-3.5" /> {statusLabel}</div>
              <p className="mt-6 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">BuildCrew Sprint</p>
              <h1 className="mt-3 max-w-[800px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[62px]">{c("30 dni. Jedna ekipa. Jeden działający projekt.", "30 days. One crew. One shipped project.")}</h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">{c("Nie masz zespołu? Dobierzemy Ci ludzi. Nie masz pomysłu? Możesz wejść do istniejącego projektu. Sprint prowadzi od dopasowania ekipy do Demo Day i realnego proof of work na Twoim profilu.", "No team yet? We'll help you find people. No idea yet? Join an existing build. Sprint takes you from crew matching to Demo Day and real proof of work on your profile.")}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {!user ? <Button asChild size="lg" variant="secondary"><Link href={signupHref}>{c("Dołącz do Sprintu", "Join the Sprint")} <ArrowRight className="h-4 w-4" /></Link></Button> : !user.emailVerified ? <Button asChild size="lg" variant="secondary"><Link href="/verify-email">{c("Zweryfikuj e-mail i dołącz", "Verify email to join")}</Link></Button> : !user.onboardingCompleted ? <Button asChild size="lg" variant="secondary"><Link href="/onboarding">{c("Dokończ profil i dołącz", "Finish your profile to join")}</Link></Button> : null}
                <Button asChild size="lg" variant="outline"><a href="#how-it-works">{c("Jak to działa", "How it works")}</a></Button>
              </div>
            </div>

            <Card className="overflow-hidden bg-white dark:bg-[#171715]">
              <div className="border-b border-[var(--bc-line)] p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-400">{activeSprint?.status === "CLOSED" ? c("Ostatnia edycja", "Latest edition") : c("Aktualna edycja", "Current edition")}</p><h2 className="mt-2 text-xl font-semibold">{activeSprint?.title ?? "BuildCrew Sprint #1"}</h2></div><Sparkles className="h-5 w-5 text-[#8eb51f]" /></div>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{activeSprint?.prompt ?? c("Zbierz ekipę i wypuść działające MVP w 30 dni.", "Build a crew and ship a working MVP in 30 days.")}</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[var(--bc-line)]">
                <Stat icon={CalendarDays} label={c("Start", "Start")} value={start ?? c("Wkrótce", "Soon")} />
                <Stat icon={Clock3} label={c("Koniec", "Finish")} value={end ?? c("30 dni później", "30 days later")} />
                <Stat icon={Users} label={c("Uczestnicy", "Builders")} value={activeSprint ? String(participantCount) : "-"} />
                <Stat icon={Rocket} label={c("Format", "Format")} value={c("30 dni", "30 days")} />
              </div>
            </Card>
          </div>
        </section>

        {activeSprint && user?.emailVerified && user.onboardingCompleted && (activeSprint.status === "OPEN" || activeSprint.status === "BUILDING") ? (
          <section className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10">
            <div className="grid gap-7 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div>
                <p className="text-[13px] font-medium text-neutral-500">{c("Twój Sprint", "Your Sprint")}</p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">{participation?.applicationData ? c("Zgłoszenie jest gotowe.", "Your application is ready.") : c("Wypełnij krótkie zgłoszenie.", "Complete a short application.")}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{participation?.applicationData ? c("BuildCrew wykorzysta Twoje odpowiedzi do dokładniejszego matchingu Crew.", "BuildCrew will use your answers for more accurate Crew matching.") : c("4 krótkie kroki: rola i stack, dostępność, typ projektu oraz styl współpracy.", "4 short steps: role and stack, availability, project type and working style.")}</p>
              </div>
              <ChallengeJoinPanel
                challengeId={activeSprint.id}
                participation={participation}
                crews={crews}
                profileDefaults={profileDefaults ? { role: profileDefaults.role, level: profileDefaults.level, weeklyHours: profileDefaults.weeklyHours, skills: profileDefaults.skills } : null}
              />
            </div>

            {participation?.mode === "FIND_CREW" && participation.applicationData ? <div className="mt-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[13px] font-medium text-neutral-500">{c("Crew matching", "Crew matching")}</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">{c("Osoby, z którymi warto pogadać", "People worth talking to")}</h2></div><Link href="/builders" className="text-sm font-medium hover:underline">{c("Zobacz wszystkich", "See everyone")} →</Link></div>{matches.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{matches.map((item) => <ChallengeMatchCard key={item.profile.userId} challengeId={activeSprint.id} candidate={{ userId: item.profile.userId, username: item.profile.username, avatarEmoji: item.profile.avatarEmoji, role: item.profile.role, score: item.score, reasons: item.reasons }} />)}</div> : <Card className="p-5 text-sm leading-6 text-neutral-500">{c("Jeszcze nie ma wystarczająco wielu uczestników do sensownego matchingu. Gdy dołączą kolejne osoby, rekomendacje pojawią się tutaj automatycznie.", "There are not enough participants for useful matching yet. Recommendations will appear here automatically as more people join.")}</Card>}</div> : null}
          </section>
        ) : null}

        <section id="how-it-works" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
            <div className="mb-8 max-w-2xl"><p className="text-[13px] font-medium text-neutral-500">{c("Program, nie kolejny feed", "A program, not another feed")}</p><h2 className="mt-2 text-[32px] font-semibold tracking-[-0.03em]">{c("Od zapisu do działającego projektu.", "From signup to something shipped.")}</h2></div>
            <div className="grid gap-px overflow-hidden rounded-[8px] border border-[#d8d8d0] bg-[#d8d8d0] md:grid-cols-2 lg:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-700">
              <Step number="01" title={c("Zapisujesz się", "Apply")} text={c("Profil, stack, dostępność i to, czego chcesz się nauczyć albo zbudować.", "Your profile, stack, availability and what you want to learn or build.")} />
              <Step number="02" title={c("Dobieramy Crew", "Match a Crew")} text={c("Dopasowanie po roli, zainteresowaniach, czasie i celu - nie po liczbie followersów.", "Matching by role, interests, time and goals - not follower count.")} />
              <Step number="03" title={c("Budujecie 30 dni", "Build for 30 days")} text={c("Mały scope, regularny progres i jeden cel: dowieźć działającą wersję.", "Small scope, regular progress and one goal: ship a working version.")} />
              <Step number="04" title="Demo Day" text={c("Pokazujecie efekt, a projekt zostaje jako proof of work na profilach zespołu.", "Show the result and keep the project as proof of work on every teammate's profile.")} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div><p className="text-[13px] font-medium text-neutral-500">{c("Dla kogo", "Who it's for")}</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">{c("Nie musisz mieć gotowej ekipy ani perfekcyjnego pomysłu.", "You don't need a ready-made team or a perfect idea.")}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><Check text={c("Frontend / backend / mobile", "Frontend / backend / mobile")} /><Check text="UX/UI & product" /><Check text="AI / data" /><Check text={c("Marketing / growth", "Marketing / growth")} /><Check text={c("Juniorzy budujący portfolio", "Juniors building a portfolio")} /><Check text={c("Founderzy szukający pierwszej Crew", "Founders looking for their first Crew")} /></div></div>
            <Card className="p-5"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{c("Cel pierwszej edycji", "First edition goal")}</p><p className="mt-3 text-[38px] font-semibold tracking-[-0.04em]">40 → 10 → 5</p><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{c("40 uczestników, około 10 ekip i minimum 5 projektów pokazanych na Demo Day.", "40 builders, around 10 crews and at least 5 projects shown on Demo Day.")}</p></Card>
          </div>
        </section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:px-10"><div><p className="text-[13px] text-neutral-400">BuildCrew Sprint</p><h2 className="mt-3 max-w-2xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">{c("Nie zapisuj kolejnego pomysłu w Notion. Zbuduj go z ludźmi.", "Don't save another idea in Notion. Build it with people.")}</h2></div>{!user ? <Button asChild variant="secondary" size="lg"><Link href={signupHref}>{c("Dołącz do Sprintu", "Join the Sprint")}</Link></Button> : <Button asChild variant="secondary" size="lg"><Link href={user.onboardingCompleted ? "/dashboard" : "/onboarding"}>{c("Przejdź do BuildCrew", "Open BuildCrew")}</Link></Button>}</div></section>
      </main>
    </div>
  );
}

function formatDate(value: Date, locale: "pl" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="bg-white p-4 dark:bg-[#171715]"><div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400"><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-2 text-sm font-semibold">{value}</p></div>;
}
function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="bg-white p-5 dark:bg-[#171715]"><p className="text-[11px] font-semibold text-neutral-400">{number}</p><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></div>;
}
function Check({ text }: { text: string }) {
  return <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#8eb51f]" /><span>{text}</span></div>;
}
