"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profileInterests, profilePrivate, profileSkills, profiles } from "@/db/schema";
import { emojiForSeed } from "@/lib/utils";
import { consumePostAuthRedirect, getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { logEvent } from "@/lib/analytics";
import { onboardingSchema, profileEditSchema } from "@/lib/validations";
import { ensureInterests, ensureSkills } from "@/server/data/lookups";
import { z } from "zod";

export type ProfileFormState = { error?: string; success?: boolean };

async function syncSkillsAndInterests(userId: string, skillNames: string[], interestNames: string[]) {
  const [skillRows, interestRows] = await Promise.all([
    ensureSkills(skillNames),
    ensureInterests(interestNames),
  ]);

  await db.delete(profileSkills).where(eq(profileSkills.userId, userId));
  if (skillRows.length > 0) {
    await db.insert(profileSkills).values(skillRows.map((s) => ({ userId, skillId: s.id })));
  }

  await db.delete(profileInterests).where(eq(profileInterests.userId, userId));
  if (interestRows.length > 0) {
    await db.insert(profileInterests).values(interestRows.map((i) => ({ userId, interestId: i.id })));
  }
}

export async function completeOnboarding(
  input: z.infer<typeof onboardingSchema>,
): Promise<ProfileFormState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:profile:onboarding", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Sprawdź wypełnione pola." };
  }
  const data = parsed.data;

  const existingUsername = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.username, data.username));
  if (existingUsername.length > 0 && existingUsername[0].userId !== user.id) {
    return { error: "Ten nick jest już zajęty. Wybierz inny." };
  }

  try {
    await db
      .insert(profiles)
      .values({
        userId: user.id,
        username: data.username,
        role: data.role,
        level: data.level,
        weeklyHours: data.weeklyHours,
        lookingFor: data.lookingFor,
        goals: data.goals,
        githubUrl: data.githubUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        avatarEmoji: emojiForSeed(data.username),
        onboardingCompleted: true,
        onboardingStep: 5,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          username: data.username,
          role: data.role,
          level: data.level,
          weeklyHours: data.weeklyHours,
          lookingFor: data.lookingFor,
          goals: data.goals,
          githubUrl: data.githubUrl || null,
          portfolioUrl: data.portfolioUrl || null,
          linkedinUrl: data.linkedinUrl || null,
          onboardingCompleted: true,
          onboardingStep: 5,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(profilePrivate)
      .values({ userId: user.id, discordUsername: data.discordUsername || null })
      .onConflictDoUpdate({
        target: profilePrivate.userId,
        set: { discordUsername: data.discordUsername || null },
      });

    await syncSkillsAndInterests(user.id, data.skills, data.interests);
    await logEvent("profile_created", user.id, { username: data.username, role: data.role });
  } catch (err) {
    console.error(err);
    return { error: "Coś poszło nie tak. Spróbuj ponownie." };
  }

  revalidatePath("/dashboard");
  const nextPath = await consumePostAuthRedirect("/dashboard");
  redirect(`/onboarding/recommendations?next=${encodeURIComponent(nextPath)}`);
}

export async function updateProfile(input: z.infer<typeof profileEditSchema>): Promise<ProfileFormState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:profile:update", user.id, 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = profileEditSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Sprawdź wypełnione pola." };
  }
  const data = parsed.data;
  if (!data.username || !data.role || !data.level || !data.weeklyHours || !data.skills) {
    return { error: "Uzupełnij wszystkie wymagane pola." };
  }

  const existingUsername = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.username, data.username));
  if (existingUsername.length > 0 && existingUsername[0].userId !== user.id) {
    return { error: "Ten nick jest już zajęty." };
  }

  await db
    .update(profiles)
    .set({
      username: data.username,
      role: data.role,
      level: data.level,
      weeklyHours: data.weeklyHours,
      lookingFor: data.lookingFor,
      goals: data.goals ?? [],
      bio: data.bio || null,
      githubUrl: data.githubUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id));

  await db
    .insert(profilePrivate)
    .values({ userId: user.id, discordUsername: data.discordUsername || null })
    .onConflictDoUpdate({
      target: profilePrivate.userId,
      set: { discordUsername: data.discordUsername || null },
    });

  await syncSkillsAndInterests(user.id, data.skills, data.interests ?? []);

  revalidatePath("/profile");
  revalidatePath(`/builders/${user.id}`);
  return { success: true };
}
