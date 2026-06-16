import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";
import { normalizeEssayPayload } from "@/lib/essayPayload";
import { parseLimitFromPrompt } from "@/lib/essayLimits";

async function canEditEssay(essayId: string, userId: string, role: string) {
  const essay = await prisma.essay.findUnique({ where: { id: essayId } });
  if (!essay) return { essay: null, allowed: false };
  if (essay.userId === userId) return { essay, allowed: true, authorRole: "student" as const };
  if (role === "counselor" || role === "counselor") {
    const counselor = await prisma.counselorProfile.findUnique({ where: { userId } });
    if (!counselor || !essay.userId) return { essay, allowed: false };
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: essay.userId } });
    if (!studentProfile) return { essay, allowed: false };
    const link = await prisma.counselorStudentLink.findUnique({
      where: { counselorId_studentProfileId: { counselorId: counselor.id, studentProfileId: studentProfile.id } },
    });
    if (link) return { essay, allowed: true, authorRole: "counselor" as const, studentUserId: essay.userId };
  }
  return { essay, allowed: false };
}

export async function GET(_: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canEditEssay(ctx.params.essayId, session.user.id, session.user.role ?? "student");
  if (!access.essay || !access.allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const comments = await prisma.essayComment.findMany({
    where: { essayId: ctx.params.essayId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ essay: access.essay, comments });
}

export async function PUT(req: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canEditEssay(ctx.params.essayId, session.user.id, session.user.role ?? "student");
  if (!access.essay || !access.allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const parsed = essayInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid essay payload." }, { status: 400 });

  const normalized = normalizeEssayPayload(parsed.data);
  const parsedLimit = normalized.promptText ? parseLimitFromPrompt(normalized.promptText) : null;
  const authorRole = parsed.data.authorRole ?? access.authorRole ?? "student";

  const essay = await prisma.essay.update({
    where: { id: ctx.params.essayId },
    data: {
      title: normalized.title,
      essayType: normalized.essayType,
      content: normalized.content,
      richContent: normalized.richContent ?? null,
      plainText: normalized.plainText,
      status: normalized.status,
      wordCount: normalized.wordCount,
      characterCount: normalized.characterCount,
      notes: normalized.notes,
      draft: normalized.draft ?? access.essay.draft,
      promptText: normalized.promptText ?? access.essay.promptText,
      universitySlug: normalized.universitySlug ?? access.essay.universitySlug,
      universityName: normalized.universityName ?? access.essay.universityName,
      promptId: normalized.promptId ?? access.essay.promptId,
      limitType: normalized.limitType ?? parsedLimit?.limitType ?? access.essay.limitType,
      limitValue: normalized.limitValue ?? parsedLimit?.limitValue ?? access.essay.limitValue,
    },
  });

  if (parsed.data.createVersion !== false) {
    await prisma.essayVersion.create({
      data: {
        essayId: essay.id,
        content: essay.content,
        richContent: essay.richContent,
        wordCount: essay.wordCount,
        characterCount: essay.characterCount,
        createdById: session.user.id,
        authorRole,
      },
    });
  }

  return NextResponse.json({ essay });
}

export async function DELETE(_: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const essay = await prisma.essay.findUnique({ where: { id: ctx.params.essayId } });
  if (!essay || essay.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.essay.delete({ where: { id: ctx.params.essayId } });
  return NextResponse.json({ ok: true });
}
