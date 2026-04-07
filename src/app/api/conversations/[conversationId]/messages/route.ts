import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getConversationForUser, getConversationMessages } from "@/server/chatPersistence";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  ctx: { params: { conversationId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId } = ctx.params;
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversation id." }, { status: 400 });
    }

    const conv = await getConversationForUser(conversationId, session.user.id);
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const messages = await getConversationMessages(conversationId);
    return NextResponse.json({ messages, kind: conv.kind, title: conv.title });
  } catch {
    return NextResponse.json({ error: "Failed to load conversation messages." }, { status: 500 });
  }
}
