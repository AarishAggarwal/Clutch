import { prisma } from "@/server/prisma";

export const CONVERSATION_KIND_ESSAY_ASSISTANT = "essay_assistant";
export const CONVERSATION_KIND_FOUR_YEAR = "four_year_counselor";

export async function getOrCreateAssistantConversation(params: { userId: string; kind: string }) {
  const existing = await prisma.conversation.findFirst({
    where: { userId: params.userId, kind: params.kind },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return { conversationId: existing.id };

  const title = params.kind === CONVERSATION_KIND_ESSAY_ASSISTANT ? "Essay Assistant" : "4-Year Counselor";
  const conversation = await prisma.conversation.create({
    data: { userId: params.userId, kind: params.kind, title },
  });

  const greeting =
    params.kind === CONVERSATION_KIND_ESSAY_ASSISTANT
      ? "I am your Essay Assistant. Open an essay in your workspace and I will use it automatically for brainstorming, grammar, and revisions."
      : "I am your 4-Year Counselor. Ask about Common App, UC, UK or Indian admissions, course selection, timelines, and extracurricular strategy.";

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      messageType: "plain_text",
      content: greeting,
    },
  });

  return { conversationId: conversation.id };
}

export async function getConversationMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, messageType: true, createdAt: true },
  });
}

export async function appendChatMessage(params: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}) {
  await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      messageType: "plain_text",
      content: params.content,
    },
  });
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function getAssistantConversations(userId: string) {
  return prisma.conversation.findMany({
    where: {
      userId,
      kind: { in: [CONVERSATION_KIND_ESSAY_ASSISTANT, CONVERSATION_KIND_FOUR_YEAR] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, kind: true, title: true, updatedAt: true },
  });
}
