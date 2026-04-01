import { NextResponse } from "next/server";
import { createConversation } from "@/server/chatPersistence";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { title?: string } | undefined;
    const result = await createConversation({ title: body?.title });
    return NextResponse.json({ conversationId: result.conversationId });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create conversation." },
      { status: 500 },
    );
  }
}

