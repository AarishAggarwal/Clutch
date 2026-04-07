import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  CONVERSATION_KIND_ESSAY,
  CONVERSATION_KIND_PROJECT_IDEATION,
  CONVERSATION_KIND_PROJECT_IDEATOR,
  listConversations,
} from "@/server/chatPersistence";
import { authOptions } from "@/lib/auth";

const ALLOWED_KINDS = new Set([
  CONVERSATION_KIND_ESSAY,
  CONVERSATION_KIND_PROJECT_IDEATION,
  CONVERSATION_KIND_PROJECT_IDEATOR,
]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind")?.trim() || CONVERSATION_KIND_ESSAY;
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json(
      { error: "Invalid kind.", valid: Array.from(ALLOWED_KINDS) },
      { status: 400 },
    );
  }

  const conversations = await listConversations({ userId: session.user.id, kind });
  return NextResponse.json({ conversations });
}
