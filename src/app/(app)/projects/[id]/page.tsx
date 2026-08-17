import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { Topbar } from "@/components/layout/topbar";
import { ApplyDialog } from "@/components/projects/apply-dialog";
import { ProjectIdentityMark } from "@/components/projects/project-identity-mark";
import { ShareProjectButton } from "@/components/projects/share-project-button";
import { ProjectFollowButton } from "@/components/projects/project-follow-button";
import { ProjectUpdateComposer } from "@/components/projects/project-update-composer";
import { LeaveProjectButton } from "@/components/projects/project-team-manager";
import { CollaborationCheckin } from "@/components/projects/collaboration-checkin";
import { ContentReportDialog } from "@/components/moderation/content-report-dialog";
import { labelsFor } from "@/lib/constants-i18n";
import { internationalLabels } from "@/lib/international";
import { getRequestLocale } from "@/lib/site-server";
import type { AppLocale } from "@/lib/site-config";
import { getCurrentUser } from "@/lib/auth";
import { getProjectFreshness } from "@/lib/project-freshness";
import { getProjectById } from "@/server/data/projects";
import { getProjectFollowState, listProjectCredits, listProjectUpdates, PROJECT_UPDATE_KIND_LABELS } from "@/server/data/social-projects";
import { getProfileByUserId } from "@/server/data/profiles";
import { isBlockedEitherWay } from "@/server/data/moderation";
import type { Level, RoleType } from "@/db/schema";
import { refreshProjectRecruitmentAction } from "@/server/actions/projects";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const project = await getProjectById(id);
  return { title: project ? `${project.name} - BuildCrew` : `${locale === "en" ? "Project" : "Project"} - BuildCrew` };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectById(id);

  if (!project) notFound();
  if (project.ownerId !== user.id && (await isBlockedEitherWay(user.id, project.ownerId))) notFound();

  const [myProfile, ownerProfile, followState, updates, credits] = await Promise.all([
    getProfileByUserId(user.id),
    project.owner ? getProfileByUserId(project.ownerId) : Promise.resolve(null),
    getProjectFollowState(project.id, user.id),
    listProjectUpdates(project.id, 8),
    project.lifecycleStatus === "COMPLETED" ? listProjectCredits(project.id) : Promise.resolve([]),
  ]);

  const isOwner = project.ownerId === user.id;
  const myMembership = project.members.find((member) => member.userId === user.id);
  const isMember = Boolean(myMembership);
  const openSlots = project.openRoles.reduce((sum, role) => sum + Math.max(0, role.open ?? 0), 0);
  const freshness = getProjectFreshness(project.updatedAt, new Date(), locale);
  const staleRecruitment = project.lifecycleStatus === "ACTIVE" && openSlots > 0 && freshness.stale;

  return (
    <div>
      <Topbar />

      <section className="border-b border-[var(--bc-line)] pb-6 pt-1">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <ProjectIdentityMark
              name={project.name}
              tagline={project.tagline}
              projectType={project.projectType}
              technologies={project.technologies}
              size="md"
            />

            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[28px] font-semibold leading-[34px] tracking-[-0.02em] text-[var(--bc-ink)] sm:text-[30px]">
                  {project.name}
                </h1>
                <Badge variant="secondary">{labels.stages[project.stage]}</Badge>
                {project.owner?.isDemo ? <Badge variant="outline">BuildCrew Lab</Badge> : null}
                {project.lifecycleStatus === "COMPLETED" ? <Badge variant="success">{en ? "Completed" : "Completed"}</Badge> : project.lifecycleStatus === "PAUSED" ? <Badge variant="outline">{en ? "Paused" : "Paused"}</Badge> : null}
                {project.lifecycleStatus === "ACTIVE" ? <Badge variant={staleRecruitment ? "outline" : "secondary"}>{freshness.shortLabel}</Badge> : null}
              </div>

              <p className="mt-2 max-w-[760px] text-[15px] leading-[22px] text-[var(--bc-muted)]">
                {project.tagline}
              </p>

              {project.technologies.length ? (
                <TechnologyStack items={project.technologies} max={5} compact className="mt-4" />
              ) : null}
            </div>
          </div>

          <ProjectHeaderActions
            projectId={project.id}
            projectName={project.name}
            projectTagline={project.tagline}
            openRoles={project.openRoles.map((role) => ({ id: role.id, roleType: role.roleType }))}
            isOwner={isOwner}
            isMember={isMember}
            initialFollowing={followState.following}
            followerCount={followState.followers}
            locale={locale}
          />
        </div>
      </section>

      {isOwner && staleRecruitment ? (
        <section className="mt-5 border-l-[3px] border-amber-400 bg-amber-50/70 px-4 py-3 dark:bg-amber-500/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--bc-ink)]">{en ? "Are you still recruiting for this project?" : "Are you still recruiting for this project?"}</p>
              <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{freshness.label}. {en ? "Confirm recruitment so others know these roles are still open." : "Confirm recruiting so others can see that the roles are still open."}</p>
            </div>
            <form action={refreshProjectRecruitmentAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> {en ? "Still recruiting" : "Yes, still looking"}
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      {query.created === "1" && isOwner ? (
        <section className="mt-5 border-l-2 border-[var(--bc-accent)] bg-[var(--bc-surface-subtle)] px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--bc-ink)]">{en ? "Your project is live." : "Your project is published."}</p>
              <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">
                {en ? "Now find your first collaborators or share the project outside BuildCrew." : "You can now find your first teammates or share the project outside BuildCrew."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/builders">{en ? "Find people" : "Find people"}</Link>
              </Button>
              <ShareProjectButton
                projectId={project.id}
                projectName={project.name}
                projectTagline={project.tagline}
                openRoles={project.openRoles.map((role) => ({ id: role.id, roleType: role.roleType }))}
                compact
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex items-start gap-2 border-y border-[var(--bc-line)] py-3 text-[13px] leading-5 text-[var(--bc-muted)]">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <span className="font-medium text-[var(--bc-ink)]">{en ? "Safe collaboration:" : "Safer collaboration:"}</span>{" "}
          {en ? "do not send money, passwords, or API secrets to people you meet on the platform." : "do not send money, passwords, or API secrets to people you meet on the platform."}
        </p>
      </div>

      {project.lifecycleStatus === "COMPLETED" && project.outcome ? (
        <section className="mt-6 border-l-[3px] border-[var(--bc-accent)] bg-[var(--bc-surface-subtle)] px-4 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Project outcome" : "Project outcome"}</p>
          <p className="mt-1.5 max-w-[900px] text-[14px] leading-6 text-[var(--bc-ink)]">{project.outcome}</p>
        </section>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
        <main className="min-w-0">
          <ProjectSection title={en ? "About the project" : "About the project"} first>
            <div className="max-w-[820px] space-y-4 text-[14px] leading-[22px] text-[var(--bc-muted)]">
              <p className="whitespace-pre-line">{project.description}</p>
            </div>

            {project.goal ? (
              <div className="mt-6 border-l-[3px] border-[var(--bc-accent)] pl-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--bc-faint)]">{en ? "Next goal" : "Next goal"}</p>
                <p className="mt-1.5 max-w-[780px] text-[14px] leading-[21px] text-[var(--bc-ink)]">{project.goal}</p>
              </div>
            ) : null}

            {project.existingAssets.length ? (
              <div className="mt-6">
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--bc-faint)]">{en ? "What already exists" : "What already exists"}</p>
                <p className="mt-1.5 text-sm leading-5 text-[var(--bc-muted)]">
                  {project.existingAssets.map((item) => labels.projectAssets[item]).join(" · ")}
                </p>
              </div>
            ) : null}

            {project.ownerContribution ? (
              <div className="mt-6 border-l-2 border-[var(--bc-line-strong)] pl-4 text-sm leading-5 text-[var(--bc-muted)]">
                <span className="font-medium text-[var(--bc-ink)]">{en ? "Owner contribution: " : "Owner contribution: "}</span>
                {project.ownerContribution}
              </div>
            ) : null}
          </ProjectSection>

          <ProjectSection title={en ? "Updates" : "Updates"}>
            {isOwner && project.lifecycleStatus !== "COMPLETED" ? <ProjectUpdateComposer projectId={project.id} /> : null}
            {updates.length ? (
              <div className={`${isOwner && project.lifecycleStatus !== "COMPLETED" ? "mt-4" : ""} border-y border-[var(--bc-line)]`}>
                {updates.map((update) => (
                  <article key={update.id} className="grid gap-2 border-b border-[var(--bc-line)] py-4 last:border-b-0 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{projectUpdateKindLabel(update.kind, locale)}</p>
                      <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{update.createdAt.toLocaleDateString(en ? "en-US" : "en-US", { day: "2-digit", month: "short" })}</p>
                    </div>
                    <div>
                      <p className="whitespace-pre-line text-sm leading-5 text-[var(--bc-ink)]">{update.body}</p>
                      <p className="mt-1.5 text-[11px] text-[var(--bc-faint)]">{update.username}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-5 text-[var(--bc-muted)]">{en ? "No updates yet. As the project moves forward, a short progress history will appear here." : "No updates yet. As the project moves forward, a short progress history will appear here."}</p>
            )}
          </ProjectSection>

          {project.lifecycleStatus === "COMPLETED" && credits.length ? (
            <ProjectSection title={en ? "Built by" : "Zbudowali"}>
              <div className="border-y border-[var(--bc-line)]">
                {credits.map((credit) => (
                  <div key={credit.id} className="grid gap-2 border-b border-[var(--bc-line)] py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                    {credit.userId ? <Link href={`/builders/${credit.userId}`} className="text-sm font-semibold hover:underline">{credit.usernameSnapshot}</Link> : <p className="text-sm font-semibold">{credit.usernameSnapshot}</p>}
                    <p className="text-[12px] text-[var(--bc-muted)] sm:text-right">{credit.isOwner ? (en ? "Owner" : "Autor") : credit.roleType ? labels.roles[credit.roleType] : (en ? "Collaborator" : "Contributor")}</p>
                  </div>
                ))}
              </div>
            </ProjectSection>
          ) : null}

          <ProjectSection title={en ? "Who we are looking for" : "Who we are looking for"}>
            {project.roles.length === 0 ? (
              <p className="text-sm text-[var(--bc-muted)]">{en ? "No open roles." : "No open roles."}</p>
            ) : (
              <div className="border-y border-[var(--bc-line)]">
                {project.roles.map((role) => {
                  const alreadyMember = project.members.some(
                    (member) => member.roleId === role.id && member.userId === user.id,
                  );

                  return (
                    <div
                      key={role.id}
                      className="grid gap-3 border-b border-[var(--bc-line)] py-5 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:gap-5"
                    >
                      <div>
                        <p className="text-[14px] font-semibold leading-5 text-[var(--bc-ink)]">{labels.roles[role.roleType]}</p>
                        <p className="mt-1 text-[12px] leading-4 text-[var(--bc-faint)]">
                          {role.preferredLevel ? labels.levels[role.preferredLevel as Level] : (en ? "Any level" : "Any level")}
                        </p>
                      </div>

                      <div className="min-w-0">
                        {role.description ? (
                          <p className="max-w-[680px] text-sm leading-5 text-[var(--bc-muted)]">{role.description}</p>
                        ) : (
                          <p className="text-sm text-[var(--bc-faint)]">{en ? "No additional role description." : "No additional role description."}</p>
                        )}

                        {role.skills.length ? <TechnologyStack items={role.skills} max={5} compact className="mt-2.5" /> : null}

                        <p className="mt-2 text-[12px] text-[var(--bc-faint)]">
                          {role.open} {en ? (role.open === 1 ? "spot" : "spots") : (role.open === 1 ? "spot" : "miejsca")}
                        </p>
                      </div>

                      <div className="flex items-start sm:justify-end">
                        {project.lifecycleStatus === "COMPLETED" ? (
                          <Badge variant="secondary">{en ? "Project completed" : "Project completed"}</Badge>
                        ) : project.lifecycleStatus === "PAUSED" ? (
                          <Badge variant="outline">{en ? "Recruitment paused" : "Recruitment paused"}</Badge>
                        ) : isOwner ? (
                          <Badge variant={role.open > 0 ? "success" : "secondary"}>{role.open > 0 ? (en ? "Open" : "Open") : (en ? "Filled" : "Obsadzone")}</Badge>
                        ) : alreadyMember ? (
                          <Badge variant="success">{en ? "You are on the team" : "You are on the team"}</Badge>
                        ) : role.open > 0 && myProfile ? (
                          <ApplyDialog
                            projectId={project.id}
                            roleId={role.id}
                            roleType={role.roleType as RoleType}
                            myProfile={{
                              role: myProfile.role as RoleType | null,
                              skills: myProfile.skills,
                              level: myProfile.level as Level | null,
                              weeklyHours: myProfile.weeklyHours,
                            }}
                          />
                        ) : (
                          <Badge variant="secondary">{en ? "Filled" : "Obsadzone"}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ProjectSection>
        </main>

        <aside className="space-y-7 lg:sticky lg:top-6 lg:self-start">
          <SideSection title={en ? "Details" : "Details"}>
            <dl className="space-y-0">
              <Detail label={en ? "Status" : "Status"} value={project.lifecycleStatus === "COMPLETED" ? (en ? "Completed" : "Completed") : project.lifecycleStatus === "PAUSED" ? (en ? "Paused" : "Paused") : (en ? "Active" : "Active")} />
              <Detail label={en ? "Stage" : "Stage"} value={labels.stages[project.stage]} />
              {project.projectType ? <Detail label={en ? "Type" : "Typ"} value={labels.projectTypes[project.projectType]} /> : null}
              {project.commitment ? <Detail label={en ? "Time" : "Czas"} value={labels.commitments[project.commitment]} /> : null}
              {project.collaborationMode ? <Detail label={en ? "Mode" : "Work mode"} value={labels.collaborationModes[project.collaborationMode]} /> : null}
              <Detail label={en ? "Project language" : "Project language"} value={intl.projectLanguage[project.projectLanguage]} />
              <Detail label={en ? "Collaboration reach" : "Collaboration scope"} value={intl.marketScope[project.marketScope]} />
              {project.country ? <Detail label={en ? "Country" : "Kraj"} value={project.country} /> : null}
              {project.collaborationPace ? <Detail label={en ? "Pace" : "Tempo"} value={labels.collaborationPaces[project.collaborationPace]} /> : null}
              {project.duration ? <Detail label={en ? "Duration" : "Horyzont"} value={labels.durations[project.duration]} /> : null}
              {project.character.length ? (
                <Detail label={en ? "Character" : "Project character"} value={project.character.map((item) => labels.characters[item]).join(" · ")} />
              ) : null}
            </dl>
          </SideSection>

          <SideSection title={en ? "What this project needs" : "What the project needs"}>
            <div className="flex flex-wrap gap-1.5">{project.needs.map((need) => <Badge key={need} variant="outline">{intl.needs[need]}</Badge>)}</div>
            {project.needs.includes("FUNDING") ? <div className="mt-3 space-y-1.5 text-[12px] leading-5 text-[var(--bc-muted)]">
              {project.fundingStage ? <p><span className="font-medium text-[var(--bc-ink)]">{en ? "Stage:" : "Stage:"}</span> {intl.fundingStage[project.fundingStage]}</p> : null}
              {project.fundingAmount ? <p><span className="font-medium text-[var(--bc-ink)]">{en ? "Target:" : "Amount:"}</span> {project.fundingAmount}</p> : null}
              {project.fundingUse ? <p>{project.fundingUse}</p> : null}
              {project.pitchDeckUrl ? <ExternalProjectLink href={project.pitchDeckUrl} label={en ? "Pitch deck" : "Pitch deck"} /> : null}
            </div> : null}
          </SideSection>

          {project.repositoryUrl || project.demoUrl || project.designUrl || project.docsUrl ? (
            <SideSection title={"Links"}>
              <div className="space-y-1 text-sm">
                {project.repositoryUrl ? <ExternalProjectLink href={project.repositoryUrl} label={en ? "Repository" : "Repository"} /> : null}
                {project.demoUrl ? <ExternalProjectLink href={project.demoUrl} label="Demo / landing" /> : null}
                {project.designUrl ? <ExternalProjectLink href={project.designUrl} label="Design / Figma" /> : null}
                {project.docsUrl ? <ExternalProjectLink href={project.docsUrl} label={en ? "Documentation" : "Dokumentacja"} /> : null}
              </div>
            </SideSection>
          ) : null}

          {ownerProfile ? (
            <SideSection title={en ? "Owner" : "Autor"}>
              <Link
                href={`/builders/${ownerProfile.userId}`}
                className="-mx-2 flex items-center gap-3 rounded-[5px] px-2 py-1.5 transition-colors hover:bg-[var(--bc-surface-hover)]"
              >
                <Avatar username={ownerProfile.username} seed={ownerProfile.userId} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{ownerProfile.username}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">
                    {ownerProfile.role ? labels.roles[ownerProfile.role as RoleType] : ""}
                  </p>
                </div>
              </Link>
            </SideSection>
          ) : null}

          <SideSection title={`${en ? "Team" : "Team"} · ${project.members.length}`}>
            <div className="space-y-1">
              {project.members.map((member) => (
                <Link
                  key={member.userId}
                  href={`/builders/${member.userId}`}
                  className="-mx-2 flex min-h-11 items-center gap-3 rounded-[5px] px-2 py-1.5 transition-colors hover:bg-[var(--bc-surface-hover)]"
                >
                  <Avatar username={member.profile?.username ?? "Builder"} seed={member.userId} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{member.profile?.username ?? "Builder"}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">
                      {member.isOwner ? (en ? "Owner" : "Autor") : member.roleType ? labels.roles[member.roleType] : (en ? "Member" : "Member")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </SideSection>

          {isOwner ? (
            <div className="space-y-2 pt-1">
              <Button asChild className="w-full">
                <Link href={`/projects/${project.id}/manage`}>{en ? "Manage team" : "Manage team"}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/projects/${project.id}/applications`}>{en ? "Applications" : "Applications"}</Link>
              </Button>
            </div>
          ) : null}

          {!isOwner && isMember ? (
            <div className="space-y-3 border-t border-[var(--bc-line)] pt-5">
              <p className="text-[13px] text-[var(--bc-muted)]">You are a member of this team.</p>
              {myMembership && !myMembership.isOwner ? <CollaborationCheckin projectId={project.id} memberId={myMembership.userId} status={myMembership.collaborationStatus} memberConfirmed={Boolean(myMembership.memberConfirmedAt)} ownerConfirmed={Boolean(myMembership.ownerConfirmedAt)} viewerRole="MEMBER" joinedAt={myMembership.joinedAt} /> : null}
              <LeaveProjectButton projectId={project.id} projectName={project.name} />
            </div>
          ) : null}

          {isOwner && project.members.some((member) => !member.isOwner) ? (
            <SideSection title="Collaboration checks">
              <div className="space-y-3">
                {project.members.filter((member) => !member.isOwner).map((member) => <div key={member.userId} className="rounded-[7px] border border-[var(--bc-line)] p-3"><p className="mb-2 text-[12px] font-semibold text-[var(--bc-ink)]">{member.profile?.username ?? "Team member"}</p><CollaborationCheckin projectId={project.id} memberId={member.userId} status={member.collaborationStatus} memberConfirmed={Boolean(member.memberConfirmedAt)} ownerConfirmed={Boolean(member.ownerConfirmedAt)} viewerRole="OWNER" compact joinedAt={member.joinedAt} /></div>)}
              </div>
            </SideSection>
          ) : null}

          {!isOwner ? <div className="border-t border-[var(--bc-line)] pt-3"><ContentReportDialog targetType="PROJECT" targetId={project.id} label="Report project" compact /></div> : null}
        </aside>
      </div>
    </div>
  );
}

function ProjectHeaderActions({
  projectId,
  projectName,
  projectTagline,
  openRoles,
  isOwner,
  isMember,
  initialFollowing,
  followerCount,
  locale,
}: {
  projectId: string;
  projectName: string;
  projectTagline: string;
  openRoles: { id: string; roleType: RoleType }[];
  isOwner: boolean;
  isMember: boolean;
  initialFollowing: boolean;
  followerCount: number;
  locale: AppLocale;
}) {
  const en = locale === "en";
  return (
    <div className="flex flex-wrap items-center gap-2 xl:max-w-[460px] xl:justify-end">
      {isOwner ? (
        <Button asChild size="sm">
          <Link href={`/projects/${projectId}/manage`}>{en ? "Manage project" : "Manage project"}</Link>
        </Button>
      ) : isMember ? (
        <Button asChild size="sm">
          <Link href={`/projects/${projectId}/workspace`}>{en ? "Team workspace" : "Team workspace"}</Link>
        </Button>
      ) : null}

      {isOwner ? (
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/workspace`}>Workspace</Link>
        </Button>
      ) : null}

      <ProjectFollowButton projectId={projectId} initialFollowing={initialFollowing} initialFollowers={followerCount} owner={isOwner} compact />

      <ShareProjectButton
        projectId={projectId}
        projectName={projectName}
        projectTagline={projectTagline}
        openRoles={openRoles}
        compact
      />

      <Link
        href={`/p/${projectId}`}
        target="_blank"
        className="inline-flex h-9 items-center gap-1.5 px-1 text-sm font-medium text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-ink)]"
      >
        {en ? "Public link" : "Public link"}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ProjectSection({
  title,
  children,
  first = false,
}: {
  title: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <section className={`border-b border-[var(--bc-line)] pb-8 ${first ? "pt-0" : "pt-8"}`}>
      <h2 className="mb-4 text-[19px] font-semibold leading-6 tracking-[-0.01em] text-[var(--bc-ink)]">{title}</h2>
      {children}
    </section>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--bc-line)] pb-6">
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{title}</h2>
      {children}
    </section>
  );
}

function ExternalProjectLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-2 flex min-h-9 items-center justify-between gap-2 rounded-[5px] px-2 text-[var(--bc-muted)] transition-colors hover:bg-[var(--bc-surface-hover)] hover:text-[var(--bc-ink)]"
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function projectUpdateKindLabel(kind: keyof typeof PROJECT_UPDATE_KIND_LABELS, locale: AppLocale) {
  if (locale === "pl") return PROJECT_UPDATE_KIND_LABELS[kind];
  const english: Record<keyof typeof PROJECT_UPDATE_KIND_LABELS, string> = {
    PROGRESS: "Progress",
    ROLE: "Team / recruiting",
    MILESTONE: "Milestone",
    LAUNCH: "Launch / demo",
  };
  return english[kind];
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-9 grid-cols-[92px_minmax(0,1fr)] items-start gap-3 py-1.5">
      <dt className="text-[12px] leading-5 text-[var(--bc-faint)]">{label}</dt>
      <dd className="text-sm font-medium leading-5 text-[var(--bc-ink)]">{value}</dd>
    </div>
  );
}
