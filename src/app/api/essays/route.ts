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
  let essays = await prisma.essay.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!essays.length) {
    await prisma.essay.createMany({
      data: [
        {
          userId,
          title: "Common App Personal Statement v2",
          essayType: "common_app_personal_statement",
          content: "I used to think leadership meant having the answers...",
          status: "In Revision",
          wordCount: 65,
          notes: "Need stronger opening scene.",
          draft: 2,
        },
        {
          userId,
          title: "Why Northwestern Supplement",
          essayType: "supplemental_essay",
          content: "Northwestern stands out to me because of interdisciplinary flexibility...",
          status: "Draft",
          wordCount: 57,
          notes: "Add one specific program + professor.",
          draft: 1,
        },
      ],
    });
    essays = await prisma.essay.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }
  return NextResponse.json({ essays });
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
