import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await prisma.essay.findFirst({
    where: { id: ctx.params.essayId, userId: session.user.id },
  });
  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await req.json();
  const parsed = essayInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid essay payload." }, { status: 400 });
  }
  const content = parsed.data.content.trim();
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const essay = await prisma.essay.update({
    where: { id: ctx.params.essayId },
    data: {
      title: parsed.data.title,
      essayType: parsed.data.essayType,
      content,
      status: parsed.data.status,
      wordCount,
      notes: parsed.data.notes,
      draft: parsed.data.draft ?? 1,
    },
  });
  return NextResponse.json({ essay });
}
