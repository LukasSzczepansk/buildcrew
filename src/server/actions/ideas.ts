"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, projectIdeaInterests, projects } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { ideaCreateSchema, uuidSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notifications";
import { isBlockedEitherWay } from "@/server/data/moderation";

export async function createIdea(input: z.infer<typeof ideaCreateSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:idea:create", user.id, 12, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = ideaCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane pomysłu." };

  const [idea] = await db.insert(projects).values({
    ownerId: user.id,
    entryType: "IDEA",
    name: parsed.data.name,
    tagline: parsed.data.summary,
    description: parsed.data.summary,
    stage: "IDEA",
    interests: parsed.data.interests,
  }).returning({ id: projects.id });

  await logEvent("idea_created", user.id, { ideaId: idea.id, name: parsed.data.name });
  revalidatePath("/ideas");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, ideaId: idea.id };
}

export async function toggleIdeaInterest(ideaId: string) {
  if (!uuidSchema.safeParse(ideaId).success) return { error: "Nieprawidłowy pomysł." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db.select().from(projects).where(and(eq(projects.id, ideaId), eq(projects.entryType, "IDEA"))).limit(1);
  const idea = rows[0];
  if (!idea) return { error: "Pomysł nie istnieje." };
  if (idea.ownerId === user.id) return { error: "To Twój pomysł." };
  if (await isBlockedEitherWay(user.id, idea.ownerId)) return { error: "Nie możesz wejść w interakcję z tym pomysłem." };

  const existing = await db.select().from(projectIdeaInterests)
    .where(and(eq(projectIdeaInterests.projectId, ideaId), eq(projectIdeaInterests.userId, user.id))).limit(1);

  if (existing[0]) {
    await db.delete(projectIdeaInterests).where(and(eq(projectIdeaInterests.projectId, ideaId), eq(projectIdeaInterests.userId, user.id)));
    await logEvent("idea_interest_removed", user.id, { ideaId });
  } else {
    await db.insert(projectIdeaInterests).values({ projectId: ideaId, userId: user.id });
    const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await createNotification(
      idea.ownerId,
      "IDEA_INTERESTED",
      `${profileRows[0]?.username ?? "Ktoś"} zainteresował się Twoim pomysłem ${idea.name}`,
      "Możesz sprawdzić profil tej osoby i zacząć rozmowę.",
      `/ideas/${idea.id}`,
      { actorId: user.id, entityType: "idea", entityId: idea.id },
    );
    await logEvent("idea_interested", user.id, { ideaId });
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  return { success: true, interested: !existing[0] };
}
