import { NextResponse } from "next/server";
import { getConversationMessages } from "@/server/chatPersistence";

export async function GET(
  _req: Request,
  ctx: { params: { conversationId: string } },
) {
  try {
    const { conversationId } = ctx.params;
    const messages = await getConversationMessages(conversationId);
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load conversation messages." },
      { status: 500 },
    );
  }
}

