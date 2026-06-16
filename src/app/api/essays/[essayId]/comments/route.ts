import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { essayCommentSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

async function getEssayAccess(essayId: string, userId: string, role: string) {
  const essay = await prisma.essay.findUnique({ where: { id: essayId } });
  if (!essay?.userId) return null;
  if (essay.userId === userId) return { essay, authorRole: "student" as const };
  if (role === "counselor") {
    const counselor = await prisma.counselorProfile.findUnique({ where: { userId } });
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: essay.userId } });
    if (!counselor || !studentProfile) return null;
    const link = await prisma.counselorStudentLink.findUnique({
      where: { counselorId_studentProfileId: { counselorId: counselor.id, studentProfileId: studentProfile.id } },
    });
    if (link) return { essay, authorRole: "counselor" as const };
  }
  return null;
}

export async function GET(_: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEssayAccess(ctx.params.essayId, session.user.id, session.user.role ?? "student");
  if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const comments = await prisma.essayComment.findMany({
    where: { essayId: ctx.params.essayId, parentId: null },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEssayAccess(ctx.params.essayId, session.user.id, session.user.role ?? "student");
  if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = essayCommentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid comment." }, { status: 400 });

  const comment = await prisma.essayComment.create({
    data: {
      essayId: ctx.params.essayId,
      authorId: session.user.id,
      authorRole: access.authorRole,
      content: parsed.data.content.trim(),
      anchorStart: parsed.data.anchorStart,
      anchorEnd: parsed.data.anchorEnd,
      quotedText: parsed.data.quotedText,
      parentId: parsed.data.parentId,
    },
    include: { replies: true },
  });

  if (access.authorRole === "counselor" && access.essay.userId) {
    await createNotification({
      userId: access.essay.userId,
      title: "New comment on your essay",
      body: parsed.data.content.trim().slice(0, 160),
      type: "essay_comment",
      link: `/essays?id=${ctx.params.essayId}`,
    });
  } else if (access.authorRole === "student" && access.essay.userId) {
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: access.essay.userId } });
    if (studentProfile) {
      const links = await prisma.counselorStudentLink.findMany({ where: { studentProfileId: studentProfile.id } });
      for (const link of links) {
        const counselor = await prisma.counselorProfile.findUnique({ where: { id: link.counselorId } });
        if (counselor?.userId) {
          await createNotification({
            userId: counselor.userId,
            title: "Student replied to essay comment",
            body: parsed.data.content.trim().slice(0, 160),
            type: "essay_comment_reply",
            link: `/counselor/students`,
          });
        }
      }
    }
  }

  return NextResponse.json({ comment }, { status: 201 });
}
