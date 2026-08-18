"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { externalProjectInvites, profiles, projectInvites, projectRoles, projects } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { buildCrewEmail, sendTransactionalEmail } from "@/lib/email";
import { enforceUserRateLimit, randomToken, sha256 } from "@/lib/security";
import { siteUrlForLocale } from "@/lib/site-config";
import { getRequestLocale } from "@/lib/site-server";

const sendSchema = z.object({ projectId: z.string().uuid(), roleId: z.string().uuid().optional().or(z.literal("")), email: z.string().trim().email().max(254), message: z.string().trim().max(500).optional().or(z.literal("")) });

export async function sendExternalProjectInvite(input: { projectId: string; roleId?: string; email: string; message?: string }) {
  const parsed = sendSchema.safeParse(input);
  const locale = await getRequestLocale();
  const en = locale === "en";
  if (!parsed.success) return { error: en ? "Check the email and invitation details." : "Sprawdź adres e-mail i dane zaproszenia." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "You must be logged in." : "Musisz być zalogowany." };
  const rate = await enforceUserRateLimit("action:project:external-invite", user.id, 12, 24 * 60 * 60);
  if (rate) return { error: rate };

  const rows = await db.select({ id: projects.id, name: projects.name, tagline: projects.tagline, ownerId: projects.ownerId }).from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.ownerId, user.id), eq(projects.lifecycleStatus, "ACTIVE"))).limit(1);
  const project = rows[0];
  if (!project) return { error: en ? "Active project not found." : "Nie znaleziono aktywnego projektu." };

  let roleId: string | null = null;
  if (parsed.data.roleId) {
    const role = await db.select({ id: projectRoles.id }).from(projectRoles).where(and(eq(projectRoles.id, parsed.data.roleId), eq(projectRoles.projectId, project.id))).limit(1);
    if (!role[0]) return { error: en ? "Role not found." : "Nie znaleziono tej roli." };
    roleId = role[0].id;
  }

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const inviter = profileRows[0]?.username ?? "Builder";
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await db.insert(externalProjectInvites).values({ projectId: project.id, roleId, inviterId: user.id, email: parsed.data.email.toLowerCase(), message: parsed.data.message || null, tokenHash: sha256(token), expiresAt });

  const invitePath = `/invite/project/${encodeURIComponent(token)}`;
  const result = await sendTransactionalEmail({
    to: parsed.data.email,
    subject: en ? `${inviter} invited you to ${project.name} on BuildCrew` : `${inviter} zaprasza Cię do ${project.name} na BuildCrew`,
    html: buildCrewEmail({
      locale,
      baseUrl: siteUrlForLocale(locale),
      eyebrow: en ? "Project invitation" : "Zaproszenie do projektu",
      title: en ? `Join ${project.name}` : `Dołącz do ${project.name}`,
      intro: parsed.data.message || (en ? `${inviter} thinks you could be a strong fit for this project.` : `${inviter} uważa, że możesz dobrze pasować do tego projektu.`),
      ctaLabel: en ? "View invitation" : "Zobacz zaproszenie",
      ctaHref: invitePath,
      footer: en ? "You received this email because a BuildCrew user entered your address when inviting you to a project. If this was unexpected, you can ignore it." : "Otrzymujesz tę wiadomość, ponieważ użytkownik BuildCrew podał Twój adres, zapraszając Cię do projektu. Jeśli się tego nie spodziewałeś, możesz ją zignorować.",
    }),
    devPreview: `${inviter} -> ${project.name}\n${siteUrlForLocale(locale)}${invitePath}`,
  });
  if (!result.ok) return { error: en ? "Invitation was saved, but the email could not be sent. Check Resend configuration." : "Zaproszenie zapisano, ale nie udało się wysłać e-maila. Sprawdź konfigurację Resend." };
  revalidatePath(`/projects/${project.id}/manage`);
  return { success: true } as const;
}

export async function claimExternalProjectInvite(rawToken: string) {
  const user = await getVerifiedCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/project/${rawToken}`)}`);
  const tokenHash = sha256(rawToken);
  const rows = await db.select().from(externalProjectInvites).where(and(eq(externalProjectInvites.tokenHash, tokenHash), eq(externalProjectInvites.status, "PENDING"), gt(externalProjectInvites.expiresAt, new Date()))).limit(1);
  const invite = rows[0];
  if (!invite) redirect("/invitations?external=expired");
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) redirect(`/invite/project/${rawToken}?email=wrong`);

  await db.insert(projectInvites).values({ projectId: invite.projectId, roleId: invite.roleId, inviterId: invite.inviterId, inviteeId: user.id, message: invite.message }).onConflictDoNothing();
  await db.update(externalProjectInvites).set({ status: "CLAIMED" }).where(eq(externalProjectInvites.id, invite.id));
  revalidatePath("/invitations");
  redirect("/invitations?external=claimed");
}
