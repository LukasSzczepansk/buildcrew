import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, Rocket, Sparkles, UserRoundCheck } from "lucide-react";
import { ChallengeJoinPanel } from "@/components/challenges/challenge-join-panel";
import { ChallengeMatchCard } from "@/components/challenges/challenge-match-card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getCrewById, getMembershipCrewForUser } from "@/server/data/crews";
import { getProfileByUserId } from "@/server/data/profiles";
import { getChallengeParticipation, listChallengeMatches, listChallenges } from "@/server/data/showcase";
import { launchDefaultSprintFromForm } from "@/server/actions/challenges";

export const metadata: Metadata = {
  title: "Zgłoszenie do BuildCrew Sprint",
  description: "Wypełnij krótkie zgłoszenie do BuildCrew Sprint i daj się dopasować do odpowiedniej Crew.",
};

export default async function SprintApplyPage() {
  const [locale, user, challenges] = await Promise.all([getRequestLocale(), getCurrentUser(), listChallenges()]);
  const en = locale === "en";
  const c = <T,>(pl: T, english: T): T => (en ? english : pl);
  const activeSprint = challenges.find((item) => item.status === "OPEN" || item.status === "BUILDING") ?? null;
  const signupHref = `/signup?next=${encodeURIComponent("/sprint/apply")}`;
  const loginHref = `/login?next=${encodeURIComponent("/sprint/apply")}`;
  const canLaunchSprint = Boolean(user && isAdmin(user.email, user.systemRole));

  let participation: Awaited<ReturnType<typeof getChallengeParticipation>> = null;
  let profileDefaults: Awaited<ReturnType<typeof getProfileByUserId>> = null;
  let crews: { id: string; label: string }[] = [];
  let matches: Awaited<ReturnType<typeof listChallengeMatches>> = [];

  if (activeSprint && user?.emailVerified && user.onboardingCompleted) {
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

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <header className="border-b border-[#d8d8d0] bg-[#f4f4ef]/95 backdrop-blur dark:border-[#34342f] dark:bg-[#11110f]/95">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/sprint" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew Sprint</Link>
          <div className="flex items-center gap-1.5"><LanguageSwitcher compact /><Button asChild variant="ghost" size="sm"><Link href="/sprint"><ArrowLeft className="h-4 w-4" /> {c("Wróć do Sprintu", "Back to Sprint")}</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#a8cf45] bg-[#c8f169] px-3 py-1 text-[12px] font-semibold text-neutral-950"><Rocket className="h-3.5 w-3.5" /> {c("Zgłoszenie do programu", "Program application")}</div>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[48px]">{participation?.applicationData ? c("Twoje zgłoszenie do Sprintu", "Your Sprint application") : c("Zgłoś się do BuildCrew Sprint", "Apply to BuildCrew Sprint")}</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600 dark:text-neutral-300">{c("4 krótkie kroki. Powiedz nam, co potrafisz, ile masz czasu i czego chcesz zbudować. Na tej podstawie BuildCrew pomoże dobrać Ci osoby do Crew.", "Four short steps. Tell us what you can do, how much time you have and what you want to build. BuildCrew will use that to help match your Crew.")}</p>
        </div>

        {!activeSprint ? (
          <Card className="max-w-2xl border-[#b9d56e] bg-[#f2f8df] p-6 sm:p-8 dark:border-lime-500/30 dark:bg-lime-400/5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c8f169] text-neutral-950"><LockKeyhole className="h-5 w-5" /></div>
            <h2 className="mt-5 text-2xl font-semibold">{c("Formularz jest gotowy - trzeba tylko uruchomić edycję Sprintu", "The form is ready - a Sprint edition just needs to be launched")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">{c("Nie ma teraz edycji ze statusem OPEN lub BUILDING. Gdy Sprint zostanie uruchomiony, formularz pojawi się tutaj automatycznie.", "There is currently no Sprint with OPEN or BUILDING status. Once a Sprint is launched, the application form will appear here automatically.")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {canLaunchSprint ? (
                <form action={launchDefaultSprintFromForm}>
                  <Button type="submit" size="lg" className="bg-[#c8f169] text-neutral-950 hover:bg-[#b8df5b]">{c("Uruchom Sprint #1 i otwórz formularz", "Launch Sprint #1 and open the form")}</Button>
                </form>
              ) : (
                <Button asChild size="lg"><Link href="/sprint">{c("Wróć do Sprintu", "Back to Sprint")}</Link></Button>
              )}
              {canLaunchSprint ? <Button asChild size="lg" variant="outline"><Link href="/admin/challenges">{c("Ustaw ręcznie w panelu admina", "Configure manually in admin")}</Link></Button> : null}
            </div>
          </Card>
        ) : !user ? (
          <GateCard icon={UserRoundCheck} title={c("Najpierw utwórz konto", "Create an account first")} text={c("Zgłoszenie jest przypisane do Twojego profilu BuildCrew, dzięki czemu możemy wykorzystać stack i później pokazać Ci dopasowania.", "Your application is tied to your BuildCrew profile so we can use your stack and later show your matches.")} href={signupHref} action={c("Utwórz konto i zgłoś się", "Create account and apply")} secondaryHref={loginHref} secondaryAction={c("Mam już konto", "I already have an account")} />
        ) : !user.emailVerified ? (
          <GateCard icon={CheckCircle2} title={c("Potwierdź adres e-mail", "Verify your email")} text={c("Po weryfikacji wróć tutaj i formularz będzie od razu dostępny.", "After verification, come back here and the form will be available immediately.")} href="/verify-email" action={c("Zweryfikuj e-mail", "Verify email")} />
        ) : !user.onboardingCompleted ? (
          <GateCard icon={Sparkles} title={c("Dokończ podstawowy profil", "Finish your basic profile")} text={c("Sprint wykorzystuje rolę i umiejętności z profilu jako wartości startowe. Po onboardingu wróć do /sprint/apply.", "Sprint uses your role and skills as starting values. After onboarding, return to /sprint/apply.")} href="/onboarding" action={c("Dokończ profil", "Finish profile")} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <ChallengeJoinPanel
                challengeId={activeSprint.id}
                participation={participation}
                crews={crews}
                profileDefaults={profileDefaults ? { role: profileDefaults.role, level: profileDefaults.level, weeklyHours: profileDefaults.weeklyHours, skills: profileDefaults.skills } : null}
              />

              {participation?.mode === "FIND_CREW" && participation.applicationData ? (
                <div className="mt-8">
                  <div className="mb-4"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Crew matching</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">{c("Najlepsze dopasowania", "Best matches")}</h2></div>
                  {matches.length ? <div className="grid gap-3 sm:grid-cols-2">{matches.slice(0, 6).map((item) => <ChallengeMatchCard key={item.profile.userId} challengeId={activeSprint.id} candidate={{ userId: item.profile.userId, username: item.profile.username, avatarEmoji: item.profile.avatarEmoji, role: item.profile.role, score: item.score, reasons: item.reasons }} />)}</div> : <Card className="p-5 text-sm leading-6 text-neutral-500">{c("Zgłoszenie jest zapisane. Gdy dołączą kolejne osoby, rekomendacje Crew pojawią się tutaj automatycznie.", "Your application is saved. As more people join, Crew recommendations will appear here automatically.")}</Card>}
                </div>
              ) : null}
            </div>

            <Card className="sticky top-6 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{activeSprint.title}</p>
              <h2 className="mt-3 text-lg font-semibold">{c("Co dzieje się po zgłoszeniu?", "What happens after you apply?")}</h2>
              <ol className="mt-5 space-y-4 text-sm">
                <MiniStep number="1" text={c("Zapisujemy Twoją rolę, stack i dostępność.", "We save your role, stack and availability.")} />
                <MiniStep number="2" text={c("Porównujemy Cię z innymi uczestnikami Sprintu.", "We compare you with other Sprint participants.")} />
                <MiniStep number="3" text={c("Dostajesz rekomendacje osób do wspólnej Crew.", "You get recommendations for people to build a Crew with.")} />
                <MiniStep number="4" text={c("Po Team Reveal zaczynacie 30-dniowy build.", "After Team Reveal you start the 30-day build.")} />
              </ol>
              <div className="mt-5 rounded-[7px] bg-[#eff6d8] p-3 text-xs leading-5 text-neutral-700 dark:bg-lime-400/10 dark:text-neutral-300">{c("Formularz możesz później edytować. Nie musisz znać odpowiedzi na wszystko idealnie już teraz.", "You can edit the form later. You don't need perfect answers right now.")}</div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function GateCard({ icon: Icon, title, text, href, action, secondaryHref, secondaryAction }: { icon: typeof Rocket; title: string; text: string; href: string; action: string; secondaryHref?: string; secondaryAction?: string }) {
  return <Card className="max-w-2xl p-6 sm:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f5ba] text-neutral-900"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-2xl font-semibold">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">{text}</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild size="lg"><Link href={href}>{action}</Link></Button>{secondaryHref && secondaryAction ? <Button asChild size="lg" variant="outline"><Link href={secondaryHref}>{secondaryAction}</Link></Button> : null}</div></Card>;
}

function MiniStep({ number, text }: { number: string; text: string }) {
  return <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white dark:bg-[#c8f169] dark:text-neutral-950">{number}</span><span className="pt-0.5 leading-5 text-neutral-600 dark:text-neutral-300">{text}</span></li>;
}
