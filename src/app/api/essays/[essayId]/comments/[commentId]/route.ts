import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["resolve", "reopen"]),
  reply: z.string().max(5000).optional(),
});

export async function PATCH(req: Request, ctx: { params: { essayId: string; commentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await prisma.essayComment.findFirst({
    where: { id: ctx.params.commentId, essayId: ctx.params.essayId },
    include: { essay: true },
  });
  if (!comment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (parsed.data.action === "resolve") {
    const updated = await prisma.essayComment.update({
      where: { id: comment.id },
      data: { resolved: true, resolvedAt: new Date(), resolvedById: session.user.id },
    });
    if (comment.essay.userId && comment.essay.userId !== session.user.id) {
      await createNotification({
        userId: comment.essay.userId,
        title: "Essay comment resolved",
        body: "A comment on your essay was marked resolved.",
        type: "comment_resolved",
        link: `/essays?id=${ctx.params.essayId}`,
      });
    }
    return NextResponse.json({ comment: updated });
  }

  const updated = await prisma.essayComment.update({
    where: { id: comment.id },
    data: { resolved: false, resolvedAt: null, resolvedById: null },
  });
  return NextResponse.json({ comment: updated });
}

export async function POST(req: Request, ctx: { params: { essayId: string; commentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parent = await prisma.essayComment.findFirst({
    where: { id: ctx.params.commentId, essayId: ctx.params.essayId },
    include: { essay: true },
  });
  if (!parent) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "Reply required." }, { status: 400 });

  const role = session.user.role === "counselor" ? "counselor" : "student";
  const reply = await prisma.essayComment.create({
    data: {
      essayId: ctx.params.essayId,
      authorId: session.user.id,
      authorRole: role,
      content,
      anchorStart: parent.anchorStart,
      anchorEnd: parent.anchorEnd,
      quotedText: parent.quotedText,
      parentId: parent.id,
    },
  });

  if (role === "counselor" && parent.essay.userId) {
    await createNotification({
      userId: parent.essay.userId,
      title: "New reply on your essay comment",
      body: content.slice(0, 160),
      type: "essay_comment",
      link: `/essays?id=${ctx.params.essayId}`,
    });
  }

  return NextResponse.json({ reply }, { status: 201 });
}
