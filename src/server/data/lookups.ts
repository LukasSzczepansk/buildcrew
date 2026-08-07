import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { interests, skills } from "@/db/schema";
import { ALL_SKILLS, INTEREST_OPTIONS, SKILL_GROUPS } from "@/lib/constants";

function categoryForSkill(name: string) {
  for (const [category, list] of Object.entries(SKILL_GROUPS)) {
    if (list.includes(name)) return category;
  }
  return "Other";
}

export async function ensureSkills(names: string[]) {
  const unique = Array.from(new Set(names));
  if (unique.length === 0) return [];
  const existing = await db.select().from(skills).where(inArray(skills.name, unique));
  const existingNames = new Set(existing.map((s) => s.name));
  const missing = unique.filter((n) => !existingNames.has(n));
  let inserted: typeof existing = [];
  if (missing.length > 0) {
    inserted = await db
      .insert(skills)
      .values(missing.map((name) => ({ name, category: categoryForSkill(name) })))
      .onConflictDoNothing()
      .returning();
  }
  const all = [...existing, ...inserted];
  if (all.length < unique.length) {
    const finalRows = await db.select().from(skills).where(inArray(skills.name, unique));
    return finalRows;
  }
  return all;
}

export async function ensureInterests(names: string[]) {
  const unique = Array.from(new Set(names));
  if (unique.length === 0) return [];
  const existing = await db.select().from(interests).where(inArray(interests.name, unique));
  const existingNames = new Set(existing.map((s) => s.name));
  const missing = unique.filter((n) => !existingNames.has(n));
  let inserted: typeof existing = [];
  if (missing.length > 0) {
    inserted = await db.insert(interests).values(missing.map((name) => ({ name }))).onConflictDoNothing().returning();
  }
  const all = [...existing, ...inserted];
  if (all.length < unique.length) {
    const finalRows = await db.select().from(interests).where(inArray(interests.name, unique));
    return finalRows;
  }
  return all;
}

export async function seedBaseLookups() {
  await ensureSkills(ALL_SKILLS);
  await ensureInterests(INTEREST_OPTIONS);
}
