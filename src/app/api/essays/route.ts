import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const essays = await prisma.essay.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const feedback = await prisma.counselorFeedback.findMany({
    where: { userId, targetType: "essay", visibility: "student" },
    orderBy: { createdAt: "desc" },
  });

  const byTarget = new Map<string, Array<{ id: string; content: string; createdAt: Date }>>();
  for (const f of feedback) {
    const existing = byTarget.get(f.targetId) ?? [];
    existing.push({ id: f.id, content: f.content, createdAt: f.createdAt });
    byTarget.set(f.targetId, existing);
  }
  return NextResponse.json({
    essays: essays.map((essay) => ({
      ...essay,
      counselorComments: byTarget.get(essay.id) ?? [],
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = essayInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid essay payload." }, { status: 400 });
  }
  const content = parsed.data.content.trim();
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const essay = await prisma.essay.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      essayType: parsed.data.essayType,
      content,
      status: parsed.data.status,
      wordCount,
      notes: parsed.data.notes,
      draft: parsed.data.draft ?? 1,
    },
  });
  return NextResponse.json({ essay }, { status: 201 });
}
