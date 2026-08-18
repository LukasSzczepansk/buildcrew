"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy } from "@/components/i18n/locale-provider";
import { createJobListing } from "@/server/actions/jobs";

export function JobForm() {
  const copy = useCopy(); const router = useRouter();
  const [form, setForm] = React.useState<{ companyName: string; title: string; description: string; location: string; remote: boolean; employmentType: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "FREELANCE"; skills: string; applyUrl: string; contactEmail: string }>({ companyName: "", title: "", description: "", location: "", remote: true, employmentType: "FULL_TIME", skills: "", applyUrl: "", contactEmail: "" });
  const [pending, startTransition] = React.useTransition();
  function submit() { startTransition(async () => { const result = await createJobListing(form); if (result?.error) { toast.error(result.error); return; } toast.success(copy("Oferta opublikowana.", "Job published.")); router.push(result.id ? `/jobs/${result.id}` : "/jobs"); }); }
  return <div className="space-y-4"><Field label={copy("Firma / zespół", "Company / team")}><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field><Field label={copy("Stanowisko", "Role")}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Frontend Developer" /></Field><Field label={copy("Opis", "Description")}><Textarea className="min-h-[180px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={copy("Typ", "Type")}><Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "FREELANCE" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FULL_TIME">{copy("Pełny etat", "Full-time")}</SelectItem><SelectItem value="PART_TIME">{copy("Część etatu", "Part-time")}</SelectItem><SelectItem value="INTERNSHIP">{copy("Staż", "Internship")}</SelectItem><SelectItem value="FREELANCE">Freelance</SelectItem></SelectContent></Select></Field><Field label={copy("Lokalizacja", "Location")}><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={copy("np. Warszawa", "e.g. Warsaw")} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} />Remote</label><Field label={copy("Technologie / umiejętności", "Skills / technologies")}><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript, Next.js" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={copy("Link do aplikowania", "Application URL")}><Input value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} placeholder="https://..." /></Field><Field label={copy("lub e-mail kontaktowy", "or contact email")}><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Field></div><Button onClick={submit} disabled={pending || form.title.length < 3 || form.description.length < 40 || !form.companyName}>{pending ? copy("Publikowanie…", "Publishing…") : copy("Opublikuj ofertę", "Publish job")}</Button></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[12px] font-medium">{label}</span>{children}</label>; }
