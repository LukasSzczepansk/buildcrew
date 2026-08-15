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
import { COMMITMENT_LABELS, COMMITMENT_OPTIONS, LEVEL_LABELS, LEVEL_OPTIONS, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/constants";
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

const STATUS_LABELS: Record<BuildPoolListingStatus, string> = {
  ACTIVE: "Aktywne",
  PAUSED: "Wstrzymane",
  CLOSED: "Zamknięte",
};

export function BuildPoolListingManager({ listing, defaults, activeCrew = false }: { listing: Listing | null; defaults: Defaults; activeCrew?: boolean }) {
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
    if (result?.error) return toast.error(result.error);
    toast.success(listing ? "Zgłoszenie zaktualizowane." : "Jesteś już w Build Pool!");
    setOpen(false);
  }

  async function handleStatus(status: BuildPoolListingStatus) {
    setPending(true);
    const result = await setBuildPoolListingStatus(status);
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success(status === "ACTIVE" ? "Zgłoszenie jest aktywne." : status === "PAUSED" ? "Zgłoszenie wstrzymane." : "Zgłoszenie zamknięte.");
  }

  async function handleDelete() {
    if (!window.confirm("Usunąć zgłoszenie z Build Pool?")) return;
    setPending(true);
    const result = await deleteBuildPoolListing();
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Zgłoszenie usunięte.");
  }

  return (
    <section className="mb-6 border-y border-[#d8d8d0] py-5 dark:border-neutral-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Twoje zgłoszenie w Build Pool</p>
            {listing ? <Badge variant="secondary">{STATUS_LABELS[listing.status]}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {activeCrew ? "Masz aktywną ekipę — nadal możesz zapraszać innych." : "Wystaw się, jeśli jesteś gotowy na wspólne budowanie."}
          </p>
          {listing ? <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{listing.headline}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5" disabled={activeCrew}>
                {listing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {listing ? "Edytuj" : "Wystaw się w Build Pool"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{listing ? "Edytuj zgłoszenie" : "Wystaw się w Build Pool"}</DialogTitle>
                <DialogDescription>Krótko opisz, czego szukasz. Po zapisaniu zgłoszenie będzie aktywne.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-1 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-headline">Nagłówek</Label>
                  <Input id="pool-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder="Frontend dev szuka ekipy do małego SaaS" />
                </div>
                <div className="space-y-2">
                  <Label>Rola</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as RoleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{ROLE_LABELS[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Poziom</Label>
                  <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVEL_OPTIONS.map((item) => <SelectItem key={item} value={item}>{LEVEL_LABELS[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dostępność</Label>
                  <Select value={weeklyHours} onValueChange={(value) => setWeeklyHours(value as Commitment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMITMENT_OPTIONS.map((item) => <SelectItem key={item} value={item}>{COMMITMENT_LABELS[item]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferowana wielkość ekipy</Label>
                  <Select value={crewSize} onValueChange={setCrewSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 osoby</SelectItem>
                      <SelectItem value="3">3 osoby</SelectItem>
                      <SelectItem value="4">4 osoby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-tech">Technologie</Label>
                  <Input id="pool-tech" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" />
                  <p className="text-[13px] text-neutral-400">Oddziel technologie przecinkami, maks. 10.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-wants">Co chcesz budować?</Label>
                  <Textarea id="pool-wants" value={wantsToBuild} onChange={(e) => setWantsToBuild(e.target.value)} maxLength={500} placeholder="Np. mały produkt SaaS, narzędzie dla developerów albo aplikację edukacyjną." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-avoids">Czego nie chcesz budować? (opcjonalnie)</Label>
                  <Textarea id="pool-avoids" value={avoids} onChange={(e) => setAvoids(e.target.value)} maxLength={300} placeholder="Np. krypto, duże projekty wymagające codziennych spotkań…" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pool-description">Kilka słów o współpracy (opcjonalnie)</Label>
                  <Textarea id="pool-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} placeholder="Jak lubisz pracować, czego chcesz się nauczyć, jaki masz cel…" />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSave} disabled={pending}>{pending ? "Zapisywanie…" : "Zapisz i aktywuj"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {listing?.status === "ACTIVE" ? (
            <Button variant="outline" className="gap-1.5" disabled={pending} onClick={() => handleStatus("PAUSED")}><Pause className="h-4 w-4" /> Wstrzymaj</Button>
          ) : listing ? (
            <Button variant="outline" className="gap-1.5" disabled={pending || activeCrew} onClick={() => handleStatus("ACTIVE")}><Power className="h-4 w-4" /> Aktywuj</Button>
          ) : null}
          {listing && listing.status !== "CLOSED" ? (
            <Button variant="ghost" disabled={pending} onClick={() => handleStatus("CLOSED")}>Zamknij</Button>
          ) : null}
          {listing ? (
            <Button variant="ghost" size="icon" disabled={pending} onClick={handleDelete} aria-label="Usuń zgłoszenie"><Trash2 className="h-4 w-4" /></Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
