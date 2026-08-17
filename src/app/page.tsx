import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { countryLabel } from "@/lib/countries";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listPublicProjectsForLanding } from "@/server/data/projects";
import { listPublicBuildersForLanding } from "@/server/data/profiles";

const TITLE = "BuildCrew - professional network for people who build";
const DESCRIPTION = "Find teammates, co-founders and collaborators, showcase what you build, grow your professional network and get discovered for new opportunities.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: siteUrlForLocale("en") },
  openGraph: { type: "website", locale: openGraphLocale("en"), siteName: "BuildCrew", title: TITLE, description: DESCRIPTION, url: siteUrlForLocale("en") },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");

  const [featuredProjects, featuredBuilders] = await Promise.all([listPublicProjectsForLanding(4), listPublicBuildersForLanding(4)]);
  const labels = labelsFor("en");
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildCrew",
    url: siteUrlForLocale("en"),
    description: DESCRIPTION,
    inLanguage: localeCode("en"),
  };

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <JsonLd data={websiteJsonLd} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />BuildCrew</Link>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex dark:text-neutral-400">
            <a href="#people" className="hover:text-neutral-950 hover:underline dark:hover:text-white">People</a>
            <Link href="/explore/projects" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Projects</Link>
            <a href="#how-it-works" className="hover:text-neutral-950 hover:underline dark:hover:text-white">How it works</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
            <Button asChild size="sm"><Link href="/signup">Create profile</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end lg:px-10 lg:py-24">
          <div>
            <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">People · projects · proof of work · opportunities</p>
            <h1 className="mt-5 max-w-[820px] text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">Build your network by building real things.</h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-7 text-neutral-600 dark:text-neutral-300">Find teammates, co-founders and collaborators. Show what you are building, grow a professional network around real work and make it easier for the right people to discover you.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild size="lg"><Link href="/signup">Create your profile <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/explore/projects">Explore projects</Link></Button>
            </div>
          </div>

          <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
            <div className="flex items-center justify-between border-b border-[#d8d8d0] py-3 text-[12px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"><span>Projects looking for people</span><Link href="/explore/projects" className="hover:text-neutral-950 hover:underline dark:hover:text-white">See all</Link></div>
            {featuredProjects.length ? featuredProjects.map((project) => {
              const roles = project.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType]).join(" + ");
              const stack = project.technologies.slice(0, 3).join(" · ") || "Digital project";
              return <PreviewRow key={project.id} href={`/p/${project.id}`} name={project.name} meta={`${labels.stages[project.stage]} · ${roles || "team complete"}`} stack={stack} />;
            }) : <div className="border-b border-[#d8d8d0] py-5 text-[13px] leading-5 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">Public projects will appear here as soon as builders publish them.</div>}
          </div>
        </section>

        <section id="people" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10">
            <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div><p className="text-[13px] font-medium text-neutral-500">BuildCrew network</p><h2 className="mt-1 text-[28px] font-semibold tracking-[-0.025em]">People open to opportunities</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">Discover people by skills, projects, availability and what they are open to next.</p></div>
              <Link href="/signup" className="text-sm font-medium hover:underline">Join the network <ArrowRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            {featuredBuilders.length ? <div className="grid gap-px overflow-hidden border border-[#d8d8d0] bg-[#d8d8d0] sm:grid-cols-2 lg:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-700">
              {featuredBuilders.map((builder) => <Link key={builder.userId} href={`/u/${builder.username}`} className="bg-white p-5 transition-colors hover:bg-[#f7f7f3] dark:bg-[#171715] dark:hover:bg-[#1d1d1a]">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{builder.username}</h3><p className="mt-0.5 text-[12px] text-neutral-500">{builder.headline || (builder.role ? labels.roles[builder.role] : "Builder")}</p></div><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#a8d62f]" /></div>
                <p className="mt-4 min-h-10 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">{builder.skills.slice(0, 4).join(" · ") || "Building a professional profile"}</p>
                <p className="mt-4 text-[12px] font-medium text-neutral-700 dark:text-neutral-200">{opportunityStatusLabel(builder.lookingFor) || "Open to connecting"}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">{builder.country ? <span className="font-medium text-neutral-700 dark:text-neutral-200">{countryLabel(builder.country)}</span> : null}{builder.languages.length ? <span>{builder.languages.slice(0,2).join(", ")}</span> : null}</div>
                <p className="mt-5 text-[12px] font-medium">View profile →</p>
              </Link>)}
            </div> : <div className="border-y border-[#d8d8d0] py-6 text-sm text-neutral-500 dark:border-neutral-700">Create a public profile and be among the first people visible here.</div>}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div><p className="text-[13px] font-medium text-neutral-500">One profile</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.025em]">More than a CV.</h2><p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">BuildCrew connects your skills with the projects, people and collaboration history behind them.</p></div>
            <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
              <ValueRow number="01" title="Find people" text="Meet teammates, co-founders and specialists based on skills, interests, availability and real project context." />
              <ValueRow number="02" title="Build and showcase projects" text="Projects become proof of what you can create, not just another line in a profile." />
              <ValueRow number="03" title="Grow your professional network" text="Connections become more meaningful when you can see what someone built and who they worked with." />
              <ValueRow number="04" title="Get discovered for work" text="Mark yourself open to full-time, freelance or internship opportunities and let your work speak before a traditional recruiting process starts." />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#d8d8d0] bg-white dark:border-[#34342f] dark:bg-[#171715]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
            <div><p className="text-[13px] font-medium text-neutral-500">How it works</p><h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">Profile → people → projects → reputation.</h2></div>
            <ol className="border-t border-[#b9b9b1] dark:border-neutral-600">
              <ValueRow number="1" title="Create your builder profile" text="Add skills, interests, availability, links and the opportunities you are open to." />
              <ValueRow number="2" title="Meet the right people" text="Search the network or use recommendations to find people worth talking to." />
              <ValueRow number="3" title="Build something together" text="Join a project, invite someone to yours and keep your project history connected to the people behind it." />
              <ValueRow number="4" title="Turn work into reputation" text="Completed projects and collaboration history make your profile stronger for the next project, co-founder conversation or job opportunity." />
            </ol>
          </div>
        </section>

        <section className="border-y border-neutral-800 bg-[#151513] text-neutral-100"><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10"><div><p className="text-[13px] text-neutral-400">BuildCrew</p><h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">Show what you build. Meet people worth building with. Create opportunities from real work.</h2></div><Button asChild variant="secondary" size="lg"><Link href="/signup">Create profile</Link></Button></div></section>
      </main>

      <footer className="border-t border-[#d8d8d0] dark:border-[#34342f]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 py-7 text-[12px] text-neutral-500 sm:flex-row sm:items-center sm:px-8 lg:px-10"><p>© {new Date().getFullYear()} BuildCrew</p><div className="flex flex-wrap gap-5"><Link href="/explore/projects" className="hover:underline">Projects</Link><Link href="/terms" className="hover:underline">Terms</Link><Link href="/privacy" className="hover:underline">Privacy</Link><Link href="/login" className="hover:underline">Log in</Link></div></div></footer>
    </div>
  );
}

function PreviewRow({ href, name, meta, stack }: { href: string; name: string; meta: string; stack: string }) { return <Link href={href} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d8d8d0] py-4 transition-colors hover:bg-black/[0.025] dark:border-neutral-700 dark:hover:bg-white/[0.03]"><div><p className="text-[14px] font-semibold tracking-[-0.01em]">{name}</p><p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{meta}</p></div><p className="max-w-[190px] self-end text-right text-[12px] text-neutral-500 dark:text-neutral-400">{stack}</p></Link>; }
function ValueRow({ number, title, text }: { number: string; title: string; text: string }) { return <div className="grid gap-2 border-b border-[#d8d8d0] py-5 sm:grid-cols-[42px_210px_minmax(0,1fr)] sm:items-baseline dark:border-neutral-700"><span className="text-[12px] tabular-nums text-neutral-400">{number}</span><h3 className="text-[14px] font-semibold">{title}</h3><p className="max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{text}</p></div>; }
