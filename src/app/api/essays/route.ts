import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";
import { normalizeEssayPayload } from "@/lib/essayPayload";
import { parseLimitFromPrompt } from "@/lib/essayLimits";

function buildEssayData(payload: ReturnType<typeof normalizeEssayPayload>, userId: string) {
  const parsedLimit = payload.promptText ? parseLimitFromPrompt(payload.promptText) : null;
  return {
    userId,
    title: payload.title,
    essayType: payload.essayType,
    content: payload.content,
    richContent: payload.richContent ?? null,
    plainText: payload.plainText,
    status: payload.status,
    wordCount: payload.wordCount,
    characterCount: payload.characterCount,
    notes: payload.notes,
    draft: payload.draft ?? 1,
    promptText: payload.promptText ?? null,
    universitySlug: payload.universitySlug ?? null,
    universityName: payload.universityName ?? null,
    promptId: payload.promptId ?? null,
    limitType: payload.limitType ?? parsedLimit?.limitType ?? null,
    limitValue: payload.limitValue ?? parsedLimit?.limitValue ?? null,
  };
}

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
  const normalized = normalizeEssayPayload(parsed.data);
  if (!normalized.plainText && !normalized.richContent) {
    return NextResponse.json({ error: "Essay content required." }, { status: 400 });
  }

  const essay = await prisma.essay.create({
    data: buildEssayData(normalized, session.user.id),
  });

  await prisma.essayVersion.create({
    data: {
      essayId: essay.id,
      content: essay.content,
      richContent: essay.richContent,
      wordCount: essay.wordCount,
      characterCount: essay.characterCount,
      createdById: session.user.id,
      authorRole: "student",
    },
  });

  return NextResponse.json({ essay }, { status: 201 });
}
