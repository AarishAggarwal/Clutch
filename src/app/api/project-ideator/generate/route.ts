import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { IDEA_MODES, normalizeIntakeProfile, normalizeIdeaFilters, type IdeaModeId } from "@/lib/projectIdeator/types";
import { generateProjectIdeas } from "@/server/projectIdeator/generateIdeas";
import {
  appendChatMessage,
  CONVERSATION_KIND_PROJECT_IDEATOR,
  createProjectIdeatorConversation,
  getConversationForUser,
} from "@/server/chatPersistence";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  conversationId: z.string().optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  mode: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
  ideaCount: z.coerce.number().min(1).max(7).optional().default(5),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  userMessage: z.string().optional().default(""),
});

const allowedModes = new Set<IdeaModeId>(IDEA_MODES.map((m) => m.id));

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { mode, ideaCount, messages, userMessage } = parsed.data;
    if (!allowedModes.has(mode as IdeaModeId)) {
      return NextResponse.json({ error: "Invalid generation mode.", validModes: IDEA_MODES.map((m) => m.id) }, { status: 400 });
    }

    const profile = normalizeIntakeProfile((parsed.data.profile ?? {}) as Record<string, unknown>);
    const filters = normalizeIdeaFilters((parsed.data.filters ?? {}) as Record<string, unknown>);
    const trimmedUser =
      userMessage.trim() || "Generate project ideas from my profile and constraints.";

    let conversationId = parsed.data.conversationId?.trim() || null;
    if (!conversationId) {
      const created = await createProjectIdeatorConversation({ userId });
      conversationId = created.conversationId;
    } else {
      const conv = await getConversationForUser(conversationId, userId);
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
      if (conv.kind !== CONVERSATION_KIND_PROJECT_IDEATOR) {
        return NextResponse.json({ error: "Not a project ideator thread." }, { status: 400 });
      }
    }

    const { response, modelName } = await generateProjectIdeas({
      profile,
      mode: mode as IdeaModeId,
      filters,
      ideaCount,
      messages,
      userMessage: trimmedUser,
    });

    await appendChatMessage({
      conversationId,
      role: "user",
      messageType: "plain_text",
      content: trimmedUser,
    });
    await appendChatMessage({
      conversationId,
      role: "assistant",
      messageType: "ideator_assistant",
      content: JSON.stringify({
        assistantReply: response.assistantReply,
        ideas: response.ideas,
        modelName,
      }),
    });

    await prisma.conversation.updateMany({
      where: { id: conversationId, title: "Project ideator" },
      data: { title: trimmedUser.slice(0, 88).trim() || "Project ideator" },
    });

    return NextResponse.json({
      ok: true,
      conversationId,
      modelName,
      assistantReply: response.assistantReply,
      ideas: response.ideas,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Project ideator generation failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
