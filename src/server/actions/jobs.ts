"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { jobListings } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit, safeHttpUrl } from "@/lib/security";
import { getRequestLocale } from "@/lib/site-server";

const schema = z.object({
  companyName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(40).max(3000),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  remote: z.boolean(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE"]),
  skills: z.string().trim().max(400).optional().or(z.literal("")),
  applyUrl: z.string().trim().max(500).optional().or(z.literal("")),
  contactEmail: z.string().trim().max(254).optional().or(z.literal("")),
});

export async function createJobListing(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  const locale = await getRequestLocale();
  const en = locale === "en";
  if (!parsed.success) return { error: en ? "Check the job details." : "Sprawdź dane oferty." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "You must be logged in." : "Musisz być zalogowany." };
  const rate = await enforceUserRateLimit("action:jobs:create", user.id, 5, 7 * 24 * 60 * 60);
  if (rate) return { error: rate };
  const applyUrl = parsed.data.applyUrl ? safeHttpUrl(parsed.data.applyUrl) : null;
  const contactEmail = parsed.data.contactEmail?.trim() || null;
  if (!applyUrl && !contactEmail) return { error: en ? "Add an application URL or contact email." : "Dodaj link do aplikowania albo e-mail kontaktowy." };
  if (parsed.data.applyUrl && !applyUrl) return { error: en ? "Application URL must start with http:// or https://." : "Link do aplikowania musi zaczynać się od http:// lub https://." };
  if (contactEmail && !z.string().email().safeParse(contactEmail).success) return { error: en ? "Enter a valid contact email." : "Podaj poprawny e-mail kontaktowy." };
  const skills = [...new Set((parsed.data.skills || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean))].slice(0, 12);
  const [created] = await db.insert(jobListings).values({ ownerId: user.id, companyName: parsed.data.companyName, title: parsed.data.title, description: parsed.data.description, location: parsed.data.location || null, remote: parsed.data.remote, employmentType: parsed.data.employmentType, skills, applyUrl, contactEmail }).returning({ id: jobListings.id });
  revalidatePath("/jobs");
  return { success: true, id: created?.id } as const;
}
