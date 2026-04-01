import { NextResponse } from "next/server";
import { listConversations } from "@/server/chatPersistence";

export async function GET() {
  const conversations = await listConversations();
  return NextResponse.json({ conversations });
}

