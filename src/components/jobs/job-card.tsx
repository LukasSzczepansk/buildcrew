import Link from "next/link";
import { BriefcaseBusiness, MapPin, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import type { JobEmploymentType } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";

const employment: Record<JobEmploymentType, { pl: string; en: string }> = { FULL_TIME: { pl: "Pełny etat", en: "Full-time" }, PART_TIME: { pl: "Część etatu", en: "Part-time" }, INTERNSHIP: { pl: "Staż", en: "Internship" }, FREELANCE: { pl: "Freelance", en: "Freelance" } };

export function JobCard({ job, locale }: { job: { id: string; companyName: string; title: string; description: string; location: string | null; remote: boolean; employmentType: JobEmploymentType; skills: string[]; ownerUsername: string | null; createdAt: Date }; locale: AppLocale }) {
  const en = locale === "en";
  return <article className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--bc-faint)]">{job.companyName}</p><Link href={`/jobs/${job.id}`} className="mt-1 block text-[18px] font-semibold tracking-[-0.02em] hover:underline">{job.title}</Link><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--bc-muted)]"><span className="inline-flex items-center gap-1"><BriefcaseBusiness className="h-3.5 w-3.5" />{en ? employment[job.employmentType].en : employment[job.employmentType].pl}</span>{job.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span> : null}{job.remote ? <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" />Remote</span> : null}</div><p className="mt-3 bc-truncate-2 max-w-[760px] text-[13px] leading-5 text-[var(--bc-muted)]">{job.description}</p>{job.skills.length ? <TechnologyStack items={job.skills} max={6} compact className="mt-3" /> : null}<p className="mt-3 text-[10px] text-[var(--bc-faint)]">{job.ownerUsername ? `${en ? "Posted by" : "Dodał"} ${job.ownerUsername} · ` : ""}{job.createdAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}</p></div><Button asChild size="sm" className="shrink-0"><Link href={`/jobs/${job.id}`}>{en ? "View" : "Zobacz"}</Link></Button></div></article>;
}
