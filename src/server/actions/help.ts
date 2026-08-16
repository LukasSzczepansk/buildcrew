"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { answers, questions, questionTags } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { answerSchema, questionSchema, uuidSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notifications";
import { isBlockedEitherWay } from "@/server/data/moderation";

export async function createQuestion(input: z.infer<typeof questionSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:question:create", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź wypełnione pola." };

  const [question] = await db.insert(questions).values({ authorId: user.id, title: parsed.data.title, description: parsed.data.description }).returning();
  if (parsed.data.tags.length) await db.insert(questionTags).values(parsed.data.tags.map((tag) => ({ questionId: question.id, tag: tag.trim().slice(0, 40) })));
  await logEvent("question_created", user.id, { questionId: question.id });
  revalidatePath("/help");
  redirect(`/help/${question.id}`);
}

export async function createAnswer(input: z.infer<typeof answerSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:answer:create", user.id, 50, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź treść odpowiedzi." };
  const questionRows = await db.select().from(questions).where(eq(questions.id, parsed.data.questionId)).limit(1);
  const question = questionRows[0];
  if (!question) return { error: "Pytanie nie istnieje." };
  if (question.authorId !== user.id && await isBlockedEitherWay(user.id, question.authorId)) return { error: "Nie możesz odpowiedzieć na to pytanie." };

  await db.insert(answers).values({ questionId: parsed.data.questionId, authorId: user.id, body: parsed.data.body });
  if (question.authorId !== user.id) await createNotification(question.authorId, "QUESTION_ANSWERED", "Ktoś odpowiedział na Twoje pytanie", question.title, `/help/${question.id}`, { titleEn: "Someone answered your question", bodyEn: question.title });
  revalidatePath(`/help/${parsed.data.questionId}`);
  return { success: true };
}

export async function markAnswerHelpful(answerId: string, questionId: string) {
  if (!uuidSchema.safeParse(answerId).success || !uuidSchema.safeParse(questionId).success) return { error: "Nieprawidłowe dane." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const questionRows = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  const question = questionRows[0];
  if (!question) return { error: "Pytanie nie istnieje." };
  if (question.authorId !== user.id) return { error: "Tylko autor pytania może oznaczyć odpowiedź." };

  const answerRows = await db.select().from(answers).where(and(eq(answers.id, answerId), eq(answers.questionId, questionId))).limit(1);
  const answer = answerRows[0];
  if (!answer) return { error: "Ta odpowiedź nie należy do tego pytania." };

  await db.transaction(async (tx) => {
    await tx.update(answers).set({ isHelpful: false }).where(eq(answers.questionId, questionId));
    await tx.update(answers).set({ isHelpful: true }).where(and(eq(answers.id, answerId), eq(answers.questionId, questionId)));
  });

  if (answer.authorId !== user.id) await createNotification(answer.authorId, "ANSWER_MARKED_HELPFUL", "Twoja odpowiedź została oznaczona jako pomocna!", question.title, `/help/${questionId}`, { titleEn: "Your answer was marked as helpful!", bodyEn: question.title });
  await logEvent("answer_marked_helpful", user.id, { answerId, questionId });
  revalidatePath(`/help/${questionId}`);
  return { success: true };
}
