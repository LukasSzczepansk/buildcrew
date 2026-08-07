import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { answers, blocks, profiles, questionTags, questions, users } from "@/db/schema";
import { isUuid } from "@/lib/security";

async function getBlockedIds(viewerId?: string) {
  if (!viewerId || !isUuid(viewerId)) return new Set<string>();
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(sql`${blocks.blockerId} = ${viewerId} or ${blocks.blockedId} = ${viewerId}`);
  return new Set(rows.map((row) => row.blockerId === viewerId ? row.blockedId : row.blockerId));
}

export async function listQuestions(viewerId?: string) {
  const rows = await db
    .select({ question: questions })
    .from(questions)
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(eq(users.isSuspended, false))
    .orderBy(desc(questions.createdAt));

  const blockedIds = await getBlockedIds(viewerId);
  const visibleRows = rows.map((row) => row.question).filter((q) => !blockedIds.has(q.authorId));
  const ids = visibleRows.map((q) => q.id);
  if (ids.length === 0) return [];

  const [tagRows, answerCounts, authorRows] = await Promise.all([
    db.select().from(questionTags).where(inArray(questionTags.questionId, ids)),
    db
      .select({ questionId: answers.questionId, count: sql<number>`count(*)::int` })
      .from(answers)
      .innerJoin(users, eq(users.id, answers.authorId))
      .where(and(inArray(answers.questionId, ids), eq(users.isSuspended, false)))
      .groupBy(answers.questionId),
    db
      .select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji })
      .from(profiles)
      .where(inArray(profiles.userId, visibleRows.map((q) => q.authorId))),
  ]);

  const authorMap = new Map(authorRows.map((a) => [a.userId, a]));
  const countMap = new Map(answerCounts.map((c) => [c.questionId, c.count]));

  return visibleRows.map((q) => ({
    ...q,
    tags: tagRows.filter((t) => t.questionId === q.id).map((t) => t.tag),
    answerCount: countMap.get(q.id) ?? 0,
    author: authorMap.get(q.authorId) ?? null,
  }));
}

export async function getQuestionById(id: string, viewerId?: string) {
  if (!isUuid(id)) return null;
  const rows = await db
    .select({ question: questions, isSuspended: users.isSuspended })
    .from(questions)
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(eq(questions.id, id))
    .limit(1);
  const question = rows[0]?.question;
  if (!question || rows[0]?.isSuspended) return null;

  const blockedIds = await getBlockedIds(viewerId);
  if (blockedIds.has(question.authorId)) return null;

  const [tags, rawAnswers] = await Promise.all([
    db.select().from(questionTags).where(eq(questionTags.questionId, id)),
    db
      .select({ answer: answers, isSuspended: users.isSuspended })
      .from(answers)
      .innerJoin(users, eq(users.id, answers.authorId))
      .where(eq(answers.questionId, id))
      .orderBy(desc(answers.isHelpful), answers.createdAt),
  ]);
  const answerRows = rawAnswers.filter((row) => !row.isSuspended && !blockedIds.has(row.answer.authorId)).map((row) => row.answer);

  const authorIds = Array.from(new Set([question.authorId, ...answerRows.map((a) => a.authorId)]));
  const authorRows = await db
    .select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji })
    .from(profiles)
    .where(inArray(profiles.userId, authorIds));
  const authorMap = new Map(authorRows.map((a) => [a.userId, a]));

  return {
    ...question,
    tags: tags.map((t) => t.tag),
    author: authorMap.get(question.authorId) ?? null,
    answers: answerRows.map((a) => ({ ...a, author: authorMap.get(a.authorId) ?? null })),
  };
}

export async function countHelpfulAnswersForUser(userId: string) {
  if (!isUuid(userId)) return 0;
  const rows = await db.select().from(answers).where(eq(answers.authorId, userId));
  return rows.filter((a) => a.isHelpful).length;
}
