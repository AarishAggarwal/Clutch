import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  CONVERSATION_KIND_ESSAY,
  CONVERSATION_KIND_PROJECT_IDEATION,
  CONVERSATION_KIND_PROJECT_IDEATOR,
  createConversation,
  createProjectIdeationConversation,
  createProjectIdeatorConversation,
} from "@/server/chatPersistence";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      kind?: string;
    };

    const kind = body.kind?.trim() || CONVERSATION_KIND_ESSAY;
    const userId = session.user.id;

    if (kind === CONVERSATION_KIND_PROJECT_IDEATION) {
      const result = await createProjectIdeationConversation({ userId });
      return NextResponse.json({ conversationId: result.conversationId });
    }
    if (kind === CONVERSATION_KIND_PROJECT_IDEATOR) {
      const result = await createProjectIdeatorConversation({ userId });
      return NextResponse.json({ conversationId: result.conversationId });
    }
    if (kind === CONVERSATION_KIND_ESSAY) {
      const result = await createConversation({ userId, title: body.title });
      return NextResponse.json({ conversationId: result.conversationId });
    }

    return NextResponse.json(
      {
        error: "Invalid kind.",
        valid: [CONVERSATION_KIND_ESSAY, CONVERSATION_KIND_PROJECT_IDEATION, CONVERSATION_KIND_PROJECT_IDEATOR],
      },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
  }
}
