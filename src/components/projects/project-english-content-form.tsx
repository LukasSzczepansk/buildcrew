"use client";

import * as React from "react";
import { CheckCircle2, Languages } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { labelsFor } from "@/lib/constants-i18n";
import { updateProjectEnglishContent } from "@/server/actions/projects";
import type { ProjectLanguage, ProjectUpdateKind, RoleType } from "@/db/schema";

const UPDATE_LABELS: Record<ProjectUpdateKind, string> = {
  PROGRESS: "Progress update",
  ROLE: "Team update",
  MILESTONE: "Milestone",
  LAUNCH: "Launch update",
};

export function ProjectEnglishContentForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: {
    name: string;
    tagline: string;
    description: string;
    goal: string | null;
    ownerContribution: string | null;
    outcome: string | null;
    fundingUse: string | null;
    projectLanguage: ProjectLanguage;
    roles: Array<{ id: string; roleType: RoleType; description: string | null }>;
    updates: Array<{ id: string; body: string; kind: ProjectUpdateKind; createdAt: string }>;
  };
}) {
  const labels = labelsFor("en");
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState({
    name: initial.name,
    tagline: initial.tagline,
    description: initial.description,
    goal: initial.goal ?? "",
    ownerContribution: initial.ownerContribution ?? "",
    outcome: initial.outcome ?? "",
    fundingUse: initial.fundingUse ?? "",
    roles: initial.roles.map((role) => ({ ...role, description: role.description ?? "" })),
    updates: initial.updates.map((update) => ({ ...update })),
  });

  const legacy = initial.projectLanguage !== "EN";

  function save() {
    startTransition(async () => {
      const result = await updateProjectEnglishContent(projectId, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        goal: form.goal,
        ownerContribution: form.ownerContribution,
        outcome: form.outcome,
        fundingUse: form.fundingUse,
        roles: form.roles.map((role) => ({ id: role.id, description: role.description })),
        updates: form.updates.map((update) => ({ id: update.id, body: update.body })),
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("English project content saved. This project is now visible in global discovery.");
    });
  }

  return (
    <section className="border-b border-[var(--bc-line)] pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-[var(--bc-accent-strong)]" />
            <h2 className="text-[17px] font-semibold text-[var(--bc-ink)]">Public project content</h2>
          </div>
          <p className="mt-1 max-w-[720px] text-[13px] leading-5 text-[var(--bc-muted)]">
            BuildCrew is an English-language platform. Keep every public project field in English so builders from any country can understand it.
          </p>
        </div>
        {!legacy ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--bc-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-muted)]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Visible globally
          </span>
        ) : null}
      </div>

      {legacy ? (
        <div className="mt-4 rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>This legacy project is hidden from global discovery until you translate it.</strong> Translate the fields below, including role notes and existing public updates. Saving this form marks the project as English and makes it discoverable on BuildCrew.com.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <Field label="Project name">
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={60} />
        </Field>
        <Field label="Tagline">
          <Input value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} maxLength={120} placeholder="One sentence explaining what you are building" />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={7} maxLength={2400} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Next goal">
            <Textarea value={form.goal} onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))} rows={3} maxLength={240} />
          </Field>
          <Field label="What you bring to the project">
            <Textarea value={form.ownerContribution} onChange={(event) => setForm((current) => ({ ...current, ownerContribution: event.target.value }))} rows={3} maxLength={400} />
          </Field>
        </div>
        {initial.outcome !== null ? (
          <Field label="Project outcome">
            <Textarea value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} rows={4} maxLength={1200} />
          </Field>
        ) : null}
        {initial.fundingUse !== null ? (
          <Field label="How funding will be used">
            <Textarea value={form.fundingUse} onChange={(event) => setForm((current) => ({ ...current, fundingUse: event.target.value }))} rows={3} maxLength={400} />
          </Field>
        ) : null}

        {form.roles.length ? (
          <div className="border-t border-[var(--bc-line)] pt-5">
            <p className="text-[13px] font-semibold text-[var(--bc-ink)]">Open role descriptions</p>
            <p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">Translate role-specific notes as well. Role names themselves are generated by BuildCrew in English.</p>
            <div className="mt-4 space-y-4">
              {form.roles.map((role, index) => (
                <Field key={role.id} label={labels.roles[role.roleType]}>
                  <Textarea
                    value={role.description}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      roles: current.roles.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item),
                    }))}
                    rows={3}
                    maxLength={360}
                    placeholder="What will this person work on?"
                  />
                </Field>
              ))}
            </div>
          </div>
        ) : null}

        {form.updates.length ? (
          <div className="border-t border-[var(--bc-line)] pt-5">
            <p className="text-[13px] font-semibold text-[var(--bc-ink)]">Existing public updates</p>
            <p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">Older project updates are public too. Translate them before making a legacy project globally visible.</p>
            <div className="mt-4 space-y-4">
              {form.updates.map((update, index) => (
                <Field key={update.id} label={`${UPDATE_LABELS[update.kind]} · ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(update.createdAt))}`}>
                  <Textarea
                    value={update.body}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      updates: current.updates.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item),
                    }))}
                    rows={3}
                    maxLength={1200}
                  />
                </Field>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Saving..." : legacy ? "Save and publish globally" : "Save English content"}</Button>
        <span className="text-[11px] text-[var(--bc-faint)]">Saving a legacy project marks its public content as English.</span>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
