import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { labelsFor } from "@/lib/constants-i18n";
import { getExternalProjectInvite } from "@/server/data/external-invites";
import { claimExternalProjectInvite } from "@/server/actions/external-invites";

export default async function ExternalInvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ email?: string }> }) {
  const [{ token }, query, locale, user] = await Promise.all([params, searchParams, getRequestLocale(), getCurrentUser()]);
  const invite = await getExternalProjectInvite(token);
  if (!invite) notFound();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const next = `/invite/project/${token}`;
  return <main className="min-h-screen bg-[var(--bc-canvas)] px-5 py-14 text-[var(--bc-ink)]"><div className="mx-auto max-w-[620px] rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-6 sm:p-8"><Link href="/" className="text-[15px] font-semibold">BuildCrew</Link><p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{en ? "Project invitation" : "Zaproszenie do projektu"}</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">{invite.projectName}</h1><p className="mt-2 text-sm leading-6 text-[var(--bc-muted)]">{invite.projectTagline}</p><div className="mt-6 border-y border-[var(--bc-line)] py-4 text-sm"><p><strong>{invite.inviterUsername}</strong> {en ? "invited you to collaborate." : "zaprasza Cię do współpracy."}</p>{invite.roleType ? <p className="mt-1 text-[var(--bc-muted)]">{en ? "Role:" : "Rola:"} {labels.roles[invite.roleType]}</p> : null}{invite.message ? <p className="mt-4 whitespace-pre-wrap leading-6 text-[var(--bc-muted)]">{invite.message}</p> : null}</div>{query.email === "wrong" ? <p className="mt-4 rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{en ? "Sign in with the email address that received this invitation." : "Zaloguj się adresem e-mail, na który wysłano to zaproszenie."}</p> : null}<div className="mt-6 flex flex-wrap gap-2">{user ? <form action={claimExternalProjectInvite.bind(null, token)}><Button type="submit">{en ? "Continue to invitation" : "Przejdź do zaproszenia"}</Button></form> : <><Button asChild><Link href={`/signup?next=${encodeURIComponent(next)}`}>{en ? "Create account" : "Utwórz konto"}</Link></Button><Button asChild variant="outline"><Link href={`/login?next=${encodeURIComponent(next)}`}>{en ? "Sign in" : "Zaloguj się"}</Link></Button></>}<Button asChild variant="ghost"><Link href={`/p/${invite.projectId}`}>{en ? "View public project" : "Zobacz projekt"}</Link></Button></div></div></main>;
}
