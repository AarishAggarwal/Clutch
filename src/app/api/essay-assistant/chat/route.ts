import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getEssayAssistantReply } from "@/server/essayAssistantService";
import { appendChatMessage, getConversationMessages, getOrCreateAssistantConversation } from "@/server/assistantPersistence";

const bodySchema = z.object({
  message: z.string().min(1),
  essayId: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional()
    .default([]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const { conversationId } = await getOrCreateAssistantConversation({
      userId: session.user.id,
      kind: "essay_assistant",
    });

    await appendChatMessage({
      conversationId,
      role: "user",
      content: parsed.data.message.trim(),
    });

    const history = await getConversationMessages(conversationId);
    const chatHistory = history
      .filter((m) => m.messageType === "plain_text")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const { reply, modelName } = await getEssayAssistantReply({
      userId: session.user.id,
      userMessage: parsed.data.message.trim(),
      essayId: parsed.data.essayId,
      history: chatHistory,
    });

    await appendChatMessage({
      conversationId,
      role: "assistant",
      content: reply,
    });

    const messages = await getConversationMessages(conversationId);
    return NextResponse.json({ ok: true, reply, modelName, conversationId, messages });
  } catch (err: any) {
    return NextResponse.json({ error: "Essay assistant failed.", details: String(err?.message ?? err) }, { status: 500 });
  }
}
