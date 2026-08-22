import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Rocket } from "lucide-react";
import { LaunchListItem } from "@/components/launches/launch-list-item";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth";
import { normalizeLaunchTab } from "@/lib/launches";
import { SITE_URL } from "@/lib/site-config";
import { getRequestLocale } from "@/lib/site-server";
import { listLaunches } from "@/server/data/launches";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const title = en ? "Launches - see what the community builds | BuildCrew" : "Premiery - zobacz, co buduje społeczność | BuildCrew";
  const description = en ? "Discover projects built by the BuildCrew community, give feedback and meet the people behind them." : "Zobacz projekty społeczności BuildCrew, daj feedback i poznaj ludzi, którzy je tworzą.";
  return { title, description, alternates: { canonical: `${SITE_URL}/launches` }, openGraph: { title, description, url: `${SITE_URL}/launches`, type: "website" }, robots: { index: true, follow: true } };
}

export default async function LaunchesPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getRequestLocale(), searchParams]);
  const en = locale === "en";
  const tab = normalizeLaunchTab(params.tab);
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listLaunches({ tab, page, viewerId: user?.id });
  const fallback = result.items.length ? null : await listLaunches({ tab: "new", page: 1, viewerId: user?.id });
  const tabs = [
    { key: "today", pl: "Dzisiaj", en: "Today" },
    { key: "week", pl: "Ten tydzień", en: "This week" },
    { key: "new", pl: "Najnowsze", en: "Newest" },
    { key: "popular", pl: "Najpopularniejsze", en: "Most popular" },
  ] as const;

  return (
    <div>
      {user ? (
        <Topbar
          title={en ? "Launches" : "Premiery"}
          subtitle={
            en
              ? "See what the community is building. Show your project and get useful feedback."
              : "Zobacz, co buduje społeczność. Pokaż swój projekt i zdobądź konkretny feedback."
          }
        />
      ) : null}
      <div>
        <div className={`flex flex-wrap items-start justify-between gap-5 ${user ? "justify-end" : ""}`}>
          {!user ? (
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">{en ? "Launches" : "Premiery"}</h1>
              <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[var(--bc-muted)] sm:text-sm">
                {en
                  ? "See what the community is building. Show your project and get useful feedback."
                  : "Zobacz, co buduje społeczność. Pokaż swój projekt i zdobądź pierwszy konkretny feedback."}
              </p>
            </div>
          ) : (
            <div />
          )}
          <Button asChild size="sm" className="gap-1.5">
            <Link href={user ? "/launches/new" : "/login?next=/launches/new"}>
              <Plus className="h-4 w-4" />
              {en ? "Show project" : "Pokaż projekt"}
            </Link>
          </Button>
        </div>

        <nav
          className="mt-7 flex gap-1 overflow-x-auto border-b border-[var(--bc-line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={en ? "Launch filters" : "Filtry premier"}
        >
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={`/launches?tab=${item.key}`}
              className={`relative shrink-0 px-3 py-3 text-[12px] font-medium sm:text-[13px] ${
                tab === item.key ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"
              }`}
            >
              {en ? item.en : item.pl}
              {tab === item.key ? <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--bc-accent)]" /> : null}
            </Link>
          ))}
        </nav>

        {result.items.length ? (
          <section>
            {result.items.map((item, index) => (
              <LaunchListItem
                key={item.id}
                item={item}
                locale={locale}
                canVote={Boolean(user)}
                rank={tab === "week" && page === 1 ? index + 1 : undefined}
              />
            ))}
          </section>
        ) : (
          <section>
            <div className="border-b border-[var(--bc-line)] py-12 sm:py-14">
              <div className="mx-auto max-w-[640px] rounded-[16px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-6 py-8 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-accent-strong)]">
                  <Rocket className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)]">
                  {en ? "No launches here yet" : "Jeszcze nikt tutaj nic nie pokazał"}
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[var(--bc-muted)] sm:text-sm">
                  {en
                    ? "Your project does not have to be finished. Show it to the community, collect feedback and find first testers."
                    : "Twój projekt nie musi być skończony. Pokaż go społeczności, zbierz feedback albo znajdź pierwszych testerów."}
                </p>
                <Button asChild size="sm" className="mt-5">
                  <Link href={user ? "/launches/new" : "/login?next=/launches/new"}>{en ? "Show project" : "Pokaż projekt"}</Link>
                </Button>
              </div>
            </div>

            {fallback && fallback.items.length ? (
              <div className="py-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">
                    {en ? "Recent launches" : "Ostatnie premiery"}
                  </h3>
                  {tab !== "new" ? (
                    <Link href="/launches?tab=new" className="text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">
                      {en ? "See newest" : "Zobacz najnowsze"}
                    </Link>
                  ) : null}
                </div>
                <section>
                  {fallback.items.slice(0, 4).map((item) => (
                    <LaunchListItem key={item.id} item={item} locale={locale} canVote={Boolean(user)} />
                  ))}
                </section>
              </div>
            ) : null}
          </section>
        )}

        {page > 1 || result.hasMore ? (
          <div className="mt-6 flex justify-between gap-3">
            <div>
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/launches?tab=${tab}&page=${page - 1}`}>{en ? "Previous" : "Poprzednia"}</Link>
                </Button>
              ) : null}
            </div>
            <div>
              {result.hasMore ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/launches?tab=${tab}&page=${page + 1}`}>{en ? "Next" : "Następna"}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
