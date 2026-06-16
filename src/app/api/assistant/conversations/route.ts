import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  CONVERSATION_KIND_ESSAY_ASSISTANT,
  CONVERSATION_KIND_FOUR_YEAR,
  getAssistantConversations,
  getConversationMessages,
  getOrCreateAssistantConversation,
} from "@/server/assistantPersistence";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = new URL(req.url).searchParams.get("kind");
  const conversations = await getAssistantConversations(session.user.id);
  const targetKind =
    kind === CONVERSATION_KIND_ESSAY_ASSISTANT
      ? CONVERSATION_KIND_ESSAY_ASSISTANT
      : kind === CONVERSATION_KIND_FOUR_YEAR
        ? CONVERSATION_KIND_FOUR_YEAR
        : null;

  const { conversationId } = await getOrCreateAssistantConversation({
    userId: session.user.id,
    kind: targetKind ?? CONVERSATION_KIND_ESSAY_ASSISTANT,
  });

  const messages = await getConversationMessages(conversationId);
  return NextResponse.json({ conversations, conversationId, messages });
}
