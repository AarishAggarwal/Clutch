import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(_: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const essay = await prisma.essay.findFirst({
    where: { id: ctx.params.essayId, userId: session.user.id },
  });
  if (!essay) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const versions = await prisma.essayVersion.findMany({
    where: { essayId: ctx.params.essayId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ versions });
}

export async function POST(req: Request, ctx: { params: { essayId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const essay = await prisma.essay.findFirst({
    where: { id: ctx.params.essayId, userId: session.user.id },
  });
  if (!essay) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const versionId = typeof body.versionId === "string" ? body.versionId : "";
  const version = await prisma.essayVersion.findFirst({
    where: { id: versionId, essayId: ctx.params.essayId },
  });
  if (!version) return NextResponse.json({ error: "Version not found." }, { status: 404 });

  const restored = await prisma.essay.update({
    where: { id: essay.id },
    data: {
      content: version.content,
      richContent: version.richContent,
      plainText: version.content,
      wordCount: version.wordCount,
      characterCount: version.characterCount,
    },
  });

  await prisma.essayVersion.create({
    data: {
      essayId: essay.id,
      content: restored.content,
      richContent: restored.richContent,
      wordCount: restored.wordCount,
      characterCount: restored.characterCount,
      createdById: session.user.id,
      authorRole: "student",
    },
  });

  return NextResponse.json({ essay: restored });
}
