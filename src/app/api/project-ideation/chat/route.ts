import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  appendChatMessage,
  CONVERSATION_KIND_PROJECT_IDEATION,
  createProjectIdeationConversation,
  getConversationForUser,
  getConversationMessages,
} from "@/server/chatPersistence";
import { generateProjectIdeationReply } from "@/server/projectIdeationService";
import { authOptions } from "@/lib/auth";

function buildIdeationHistory(
  rows: { role: string; messageType: string; content: string }[],
): { role: "user" | "assistant"; content: string }[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of rows) {
    if (m.messageType === "plain_text" || m.messageType === "meta") {
      if (m.role === "user") out.push({ role: "user", content: m.content });
      if (m.role === "assistant") out.push({ role: "assistant", content: m.content });
    }
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json()) as { conversationId?: string | null; text?: string };
    const text = body.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    let conversationId = body.conversationId?.trim() || null;
    if (!conversationId) {
      const created = await createProjectIdeationConversation({ userId });
      conversationId = created.conversationId;
    } else {
      const conv = await getConversationForUser(conversationId, userId);
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
      if (conv.kind !== CONVERSATION_KIND_PROJECT_IDEATION) {
        return NextResponse.json({ error: "Not a project ideation thread." }, { status: 400 });
      }
    }

    await appendChatMessage({
      conversationId,
      role: "user",
      messageType: "plain_text",
      content: text,
    });

    const rows = await getConversationMessages(conversationId);
    const history = buildIdeationHistory(rows as { role: string; messageType: string; content: string }[]);
    const { text: assistantText } = await generateProjectIdeationReply(history);

    await appendChatMessage({
      conversationId,
      role: "assistant",
      messageType: "plain_text",
      content: assistantText,
    });

    const messages = await getConversationMessages(conversationId);
    return NextResponse.json({ conversationId, messages });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Chat failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
