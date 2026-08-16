"use client";

import * as React from "react";
import { Pause, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { COMMITMENT_OPTIONS, LEVEL_OPTIONS, ROLE_OPTIONS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import type { BuildPoolListingStatus, Commitment, Level, RoleType } from "@/db/schema";
import { deleteBuildPoolListing, saveBuildPoolListing, setBuildPoolListingStatus } from "@/server/actions/build-pool";

type Listing = {
  headline: string;
  role: RoleType;
  technologies: string[];
  wantsToBuild: string;
  avoids: string | null;
  weeklyHours: Commitment;
  preferredCrewSize: number;
  level: Level;
  description: string | null;
  status: BuildPoolListingStatus;
};

type Defaults = {
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
};

export function BuildPoolListingManager({ listing, defaults, activeCrew = false }: { listing: Listing | null; defaults: Defaults; activeCrew?: boolean }) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const statusLabels: Record<BuildPoolListingStatus, string> = { ACTIVE: copy("Active", "Active"), PAUSED: copy("Paused", "Paused"), CLOSED: copy("Closed", "Closed") };
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [headline, setHeadline] = React.useState(listing?.headline ?? "");
  const [role, setRole] = React.useState<RoleType>(listing?.role ?? defaults.role ?? "FULLSTACK");
  const [technologies, setTechnologies] = React.useState((listing?.technologies.length ? listing.technologies : defaults.skills).join(", "));
  const [wantsToBuild, setWantsToBuild] = React.useState(listing?.wantsToBuild ?? "");
  const [avoids, setAvoids] = React.useState(listing?.avoids ?? "");
  const [weeklyHours, setWeeklyHours] = React.useState<Commitment>(listing?.weeklyHours ?? defaults.weeklyHours ?? "3-5");
  const [crewSize, setCrewSize] = React.useState(String(listing?.preferredCrewSize ?? 3));
  const [level, setLevel] = React.useState<Level>(listing?.level ?? defaults.level ?? "BUILDING");
  const [description, setDescription] = React.useState(listing?.description ?? "");

  async function handleSave() {
    const tech = [...new Set(technologies.split(",").map((value) => value.trim()).filter(Boolean))];
    setPending(true);
    const result = await saveBuildPoolListing({
      headline,
      role,
      technologies: tech,
      wantsToBuild,
      avoids,
      weeklyHours,
      preferredCrewSize: Number(crewSize),
      level,
      description,
    });
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(listing ? copy("Your listing has been updated.", "Your listing has been updated.") : copy("You are now open to building!", "You are now open to building!"));
    setOpen(false);
  }

  async function handleStatus(status: BuildPoolListingStatus) {
    setPending(true);
    const result = await setBuildPoolListingStatus(status);
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(status === "ACTIVE" ? copy("Your listing is active.", "Your listing is active.") : status === "PAUSED" ? copy("Your listing is paused.", "Your listing is paused.") : copy("Your listing is closed.", "Your listing is closed."));
  }

  async function handleDelete() {
    if (!window.confirm(copy("Delete your Build Pool listing?", "Delete your Build Pool listing?"))) return;
    setPending(true);
    const result = await deleteBuildPoolListing();
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(copy("Listing deleted.", "Listing deleted."));
  }

  return (
    <section className="mb-6 border-y border-[#d8d8d0] py-5 dark:border-neutral-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{copy("Your Build Pool listing", "Your Build Pool listing")}</p>
            {listing ? <Badge variant="secondary">{statusLabels[listing.status]}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {activeCrew ? copy("You already have an active team, but you can still invite people.", "You already have an active team, but you can still invite people.") : copy("Publish your availability if you are ready to build with others.", "Publish your availability if you are ready to build with others.")}
          </p>
          {listing ? <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{listing.headline}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5" disabled={activeCrew}>
                {listing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {listing ? copy("Edit", "Edit") : copy("Join Build Pool", "Join Build Pool")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{listing ? copy("Edit listing", "Edit listing") : copy("Join Build Pool", "Join Build Pool")}</DialogTitle>
                <DialogDescription>{copy("Briefly describe what you are looking for. Your listing will be active after you save it.", "Briefly describe what you are looking for. Your listing will be active after you save it.")}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-1 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-headline">{copy("Headline", "Headline")}</Label>
                  <Input id="pool-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder={copy("Frontend dev looking for a small SaaS team", "Frontend dev looking for a small SaaS team")} />
                </div>
                <div className="space-y-2">
                  <Label>{copy("Roles", "Roles")}</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as RoleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.roles[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Level", "Level")}</Label>
                  <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVEL_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.levels[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Availability", "Availability")}</Label>
                  <Select value={weeklyHours} onValueChange={(value) => setWeeklyHours(value as Commitment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMITMENT_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.commitments[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Preferred team size", "Preferred team size")}</Label>
                  <Select value={crewSize} onValueChange={setCrewSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{copy("2 people", "2 people")}</SelectItem>
                      <SelectItem value="3">{copy("3 people", "3 people")}</SelectItem>
                      <SelectItem value="4">{copy("4 people", "4 people")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-tech">{copy("Technologies", "Technologies")}</Label>
                  <Input id="pool-tech" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" />
                  <p className="text-[13px] text-neutral-400">{copy("Separate technologies with commas, max. 10.", "Separate technologies with commas, max. 10.")}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-wants">{copy("What do you want to build?", "What do you want to build?")}</Label>
                  <Textarea id="pool-wants" value={wantsToBuild} onChange={(e) => setWantsToBuild(e.target.value)} maxLength={500} placeholder={copy("e.g. a small SaaS product, developer tool or educational app.", "e.g. a small SaaS product, developer tool or educational app.")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-avoids">{copy("What do you not want to build? (optional)", "What do you not want to build? (optional)")}</Label>
                  <Textarea id="pool-avoids" value={avoids} onChange={(e) => setAvoids(e.target.value)} maxLength={300} placeholder={copy("e.g. crypto or large projects that require daily meetings…", "e.g. crypto or large projects that require daily meetings…")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-description">{copy("A few words about how you like to collaborate (optional)", "A few words about how you like to collaborate (optional)")}</Label>
                  <Textarea id="pool-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} placeholder={copy("How you like to work, what you want to learn and what your goal is…", "How you like to work, what you want to learn and what your goal is…")} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSave} disabled={pending}>{pending ? copy("Saving…", "Saving…") : copy("Save and activate", "Save and activate")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {listing?.status === "ACTIVE" ? (
            <Button variant="outline" className="gap-1.5" disabled={pending} onClick={() => handleStatus("PAUSED")}><Pause className="h-4 w-4" /> {copy("Pause", "Pause")}</Button>
          ) : listing ? (
            <Button variant="outline" className="gap-1.5" disabled={pending || activeCrew} onClick={() => handleStatus("ACTIVE")}><Power className="h-4 w-4" /> {copy("Activate", "Activate")}</Button>
          ) : null}
          {listing && listing.status !== "CLOSED" ? (
            <Button variant="ghost" disabled={pending} onClick={() => handleStatus("CLOSED")}>{copy("Close", "Close")}</Button>
          ) : null}
          {listing ? (
            <Button variant="ghost" size="icon" disabled={pending} onClick={handleDelete} aria-label={copy("Delete listing", "Delete listing")}><Trash2 className="h-4 w-4" /></Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
