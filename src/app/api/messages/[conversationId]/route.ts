import { NextResponse } from "next/server";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { messageSchema } from "@/lib/validations";
import { getConversationForUser, listConversationMessages } from "@/server/data/messages";

function noStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const user = await getVerifiedCurrentUser();
  if (!user) return noStore({ error: "UNAUTHORIZED" }, { status: 401 });
  const { conversationId } = await params;
  const access = await getConversationForUser(conversationId, user.id);
  if (!access) return noStore({ error: "NOT_FOUND" }, { status: 404 });

  const items = await listConversationMessages(conversationId);
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, user.id), isNull(messages.readAt)));

  return noStore({
    messages: items.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const user = await getVerifiedCurrentUser();
  if (!user) return noStore({ error: "Musisz być zalogowany." }, { status: 401 });
  const { conversationId } = await params;
  const access = await getConversationForUser(conversationId, user.id);
  if (!access) return noStore({ error: "Nie możesz pisać w tej rozmowie." }, { status: 403 });

  const minuteLimit = await enforceUserRateLimit("api:message:minute", user.id, 30, 60);
  if (minuteLimit) return noStore({ error: minuteLimit }, { status: 429 });
  const hourLimit = await enforceUserRateLimit("api:message:hour", user.id, 300, 60 * 60);
  if (hourLimit) return noStore({ error: hourLimit }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "Nieprawidłowe dane." }, { status: 400 });
  }
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return noStore({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowa wiadomość." }, { status: 400 });

  const now = new Date();
  const [created] = await db.insert(messages).values({
    conversationId,
    senderId: user.id,
    body: parsed.data.body,
  }).returning();
  await db.update(conversations).set({ updatedAt: now }).where(eq(conversations.id, conversationId));

  return noStore({
    message: {
      id: created.id,
      senderId: created.senderId,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      readAt: created.readAt?.toISOString() ?? null,
    },
  }, { status: 201 });
}
