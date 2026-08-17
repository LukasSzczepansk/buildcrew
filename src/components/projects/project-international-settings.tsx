"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { COUNTRY_OPTIONS, FUNDING_STAGE_OPTIONS, PROJECT_MARKET_SCOPE_OPTIONS, PROJECT_NEED_OPTIONS, internationalLabels } from "@/lib/international";
import { countryLabel } from "@/lib/countries";
import { appMessage } from "@/lib/server-copy";
import type { FundingStage, ProjectLanguage, ProjectMarketScope, ProjectNeed } from "@/db/schema";
import { updateProjectInternationalSettings } from "@/server/actions/projects";

export function ProjectInternationalSettings({ projectId, initial }: { projectId: string; initial: { projectLanguage: ProjectLanguage; country: string | null; marketScope: ProjectMarketScope; needs: ProjectNeed[]; fundingStage: FundingStage | null; fundingAmount: string | null; fundingUse: string | null; pitchDeckUrl: string | null } }) {
  const copy = useCopy(); const locale = useLocale(); const intl = internationalLabels(locale);
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState({ projectLanguage: initial.projectLanguage, country: initial.country ?? "", marketScope: initial.marketScope, needs: initial.needs, fundingStage: initial.fundingStage ?? "" as FundingStage | "", fundingAmount: initial.fundingAmount ?? "", fundingUse: initial.fundingUse ?? "", pitchDeckUrl: initial.pitchDeckUrl ?? "" });
  const toggleNeed = (need: ProjectNeed) => setState((current) => ({ ...current, needs: current.needs.includes(need) ? (current.needs.length === 1 ? current.needs : current.needs.filter((item) => item !== need)) : [...current.needs, need] }));
  const save = () => startTransition(async () => {
    const result = await updateProjectInternationalSettings(projectId, { ...state, fundingStage: state.fundingStage || undefined });
    if ("error" in result && result.error) {
      toast.error(appMessage(result.error, locale));
      return;
    }
    toast.success(copy("Project settings saved.", "Project settings saved."));
  });
  return <div className="space-y-4">
    <div><Label>Collaboration reach</Label><Select value={state.marketScope} onValueChange={(value) => setState((current) => ({ ...current, marketScope: value as ProjectMarketScope }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_MARKET_SCOPE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{intl.marketScope[value]}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>{copy("Country / team base", "Country / team base")}</Label><Select value={state.country || "__none"} onValueChange={(value) => setState((current) => ({ ...current, country: value === "__none" ? "" : value }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">{copy("Not specified", "Not specified")}</SelectItem>{COUNTRY_OPTIONS.map((value) => <SelectItem key={value} value={value}>{countryLabel(value)}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>{copy("What the project needs now", "What the project needs now")}</Label><div className="mt-2 flex flex-wrap gap-2">{PROJECT_NEED_OPTIONS.map((need) => <button key={need} type="button" onClick={() => toggleNeed(need)} className={`rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium ${state.needs.includes(need) ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]" : "border-[var(--bc-line)]"}`}>{intl.needs[need]}</button>)}</div></div>
    {state.needs.includes("FUNDING") ? <div className="grid gap-4 rounded-[8px] border border-[var(--bc-line)] p-4 sm:grid-cols-2"><div><Label>{copy("Funding stage", "Funding stage")}</Label><Select value={state.fundingStage || "__none"} onValueChange={(value) => setState((current) => ({ ...current, fundingStage: value === "__none" ? "" : value as FundingStage }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">{copy("Not specified", "Not specified")}</SelectItem>{FUNDING_STAGE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{intl.fundingStage[value]}</SelectItem>)}</SelectContent></Select></div><div><Label>{copy("Target amount", "Target amount")}</Label><Input className="mt-1.5" value={state.fundingAmount} onChange={(e) => setState((c) => ({ ...c, fundingAmount: e.target.value }))} placeholder={copy("e.g. €50k–€100k", "e.g. €50k–€100k")} /></div><div className="sm:col-span-2"><Label>{copy("Use of funds", "Use of funds")}</Label><Textarea className="mt-1.5" value={state.fundingUse} onChange={(e) => setState((c) => ({ ...c, fundingUse: e.target.value }))} rows={3} /></div><div className="sm:col-span-2"><Label>Pitch deck URL</Label><Input className="mt-1.5" value={state.pitchDeckUrl} onChange={(e) => setState((c) => ({ ...c, pitchDeckUrl: e.target.value }))} placeholder="https://" /></div></div> : null}
    <Button type="button" onClick={save} disabled={pending}>{pending ? copy("Saving...", "Saving...") : copy("Save settings", "Save settings")}</Button>
  </div>;
}
