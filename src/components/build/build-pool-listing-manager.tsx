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
  const statusLabels: Record<BuildPoolListingStatus, string> = { ACTIVE: copy("Aktywne", "Active"), PAUSED: copy("Wstrzymane", "Paused"), CLOSED: copy("Zamknięte", "Closed") };
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
    toast.success(listing ? copy("Zgłoszenie zaktualizowane.", "Your listing has been updated.") : copy("Jesteś już w Build Pool!", "You are now open to building!"));
    setOpen(false);
  }

  async function handleStatus(status: BuildPoolListingStatus) {
    setPending(true);
    const result = await setBuildPoolListingStatus(status);
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(status === "ACTIVE" ? copy("Zgłoszenie jest aktywne.", "Your listing is active.") : status === "PAUSED" ? copy("Zgłoszenie wstrzymane.", "Your listing is paused.") : copy("Zgłoszenie zamknięte.", "Your listing is closed."));
  }

  async function handleDelete() {
    if (!window.confirm(copy("Usunąć zgłoszenie z Build Pool?", "Delete your Build Pool listing?"))) return;
    setPending(true);
    const result = await deleteBuildPoolListing();
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(copy("Zgłoszenie usunięte.", "Listing deleted."));
  }

  return (
    <section className="mb-6 border-y border-[#d8d8d0] py-5 dark:border-neutral-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{copy("Twoje zgłoszenie w Build Pool", "Your Build Pool listing")}</p>
            {listing ? <Badge variant="secondary">{statusLabels[listing.status]}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {activeCrew ? copy("Masz aktywną ekipę - nadal możesz zapraszać innych.", "You already have an active team, but you can still invite people.") : copy("Wystaw się, jeśli jesteś gotowy na wspólne budowanie.", "Publish your availability if you are ready to build with others.")}
          </p>
          {listing ? <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{listing.headline}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5" disabled={activeCrew}>
                {listing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {listing ? copy("Edytuj", "Edit") : copy("Wystaw się w Build Pool", "Join Build Pool")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{listing ? copy("Edytuj zgłoszenie", "Edit listing") : copy("Wystaw się w Build Pool", "Join Build Pool")}</DialogTitle>
                <DialogDescription>{copy("Krótko opisz, czego szukasz. Po zapisaniu zgłoszenie będzie aktywne.", "Briefly describe what you are looking for. Your listing will be active after you save it.")}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-1 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-headline">{copy("Nagłówek", "Headline")}</Label>
                  <Input id="pool-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder={copy("Frontend dev szuka ekipy do małego SaaS", "Frontend dev looking for a small SaaS team")} />
                </div>
                <div className="space-y-2">
                  <Label>{copy("Rola", "Role")}</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as RoleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.roles[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Poziom", "Level")}</Label>
                  <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVEL_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.levels[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Dostępność", "Availability")}</Label>
                  <Select value={weeklyHours} onValueChange={(value) => setWeeklyHours(value as Commitment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMITMENT_OPTIONS.map((item) => <SelectItem key={item} value={item}>{labels.commitments[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{copy("Preferowana wielkość ekipy", "Preferred team size")}</Label>
                  <Select value={crewSize} onValueChange={setCrewSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{copy("2 osoby", "2 people")}</SelectItem>
                      <SelectItem value="3">{copy("3 osoby", "3 people")}</SelectItem>
                      <SelectItem value="4">{copy("4 osoby", "4 people")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-tech">{copy("Technologie", "Technologies")}</Label>
                  <Input id="pool-tech" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" />
                  <p className="text-[13px] text-neutral-400">{copy("Oddziel technologie przecinkami, maks. 10.", "Separate technologies with commas, max. 10.")}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-wants">{copy("Co chcesz budować?", "What do you want to build?")}</Label>
                  <Textarea id="pool-wants" value={wantsToBuild} onChange={(e) => setWantsToBuild(e.target.value)} maxLength={500} placeholder={copy("Np. mały produkt SaaS, narzędzie dla developerów albo aplikację edukacyjną.", "e.g. a small SaaS product, developer tool or educational app.")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-avoids">{copy("Czego nie chcesz budować? (opcjonalnie)", "What do you not want to build? (optional)")}</Label>
                  <Textarea id="pool-avoids" value={avoids} onChange={(e) => setAvoids(e.target.value)} maxLength={300} placeholder={copy("Np. krypto, duże projekty wymagające codziennych spotkań…", "e.g. crypto or large projects that require daily meetings…")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-description">{copy("Kilka słów o współpracy (opcjonalnie)", "A few words about how you like to collaborate (optional)")}</Label>
                  <Textarea id="pool-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} placeholder={copy("Jak lubisz pracować, czego chcesz się nauczyć, jaki masz cel…", "How you like to work, what you want to learn and what your goal is…")} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSave} disabled={pending}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz i aktywuj", "Save and activate")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {listing?.status === "ACTIVE" ? (
            <Button variant="outline" className="gap-1.5" disabled={pending} onClick={() => handleStatus("PAUSED")}><Pause className="h-4 w-4" /> {copy("Wstrzymaj", "Pause")}</Button>
          ) : listing ? (
            <Button variant="outline" className="gap-1.5" disabled={pending || activeCrew} onClick={() => handleStatus("ACTIVE")}><Power className="h-4 w-4" /> {copy("Aktywuj", "Activate")}</Button>
          ) : null}
          {listing && listing.status !== "CLOSED" ? (
            <Button variant="ghost" disabled={pending} onClick={() => handleStatus("CLOSED")}>{copy("Zamknij", "Close")}</Button>
          ) : null}
          {listing ? (
            <Button variant="ghost" size="icon" disabled={pending} onClick={handleDelete} aria-label={copy("Usuń zgłoszenie", "Delete listing")}><Trash2 className="h-4 w-4" /></Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
