import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";

export async function GET() {
  let essays = await prisma.essay.findMany({ orderBy: { updatedAt: "desc" } });
  if (!essays.length) {
    await prisma.essay.createMany({
      data: [
        {
          title: "Common App Personal Statement v2",
          essayType: "common_app_personal_statement",
          content: "I used to think leadership meant having the answers...",
          status: "In Revision",
          wordCount: 65,
          notes: "Need stronger opening scene.",
          draft: 2,
        },
        {
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
    essays = await prisma.essay.findMany({ orderBy: { updatedAt: "desc" } });
  }
  return NextResponse.json({ essays });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = essayInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid essay payload." }, { status: 400 });
  }
  const content = parsed.data.content.trim();
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const essay = await prisma.essay.create({
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
  return NextResponse.json({ essay }, { status: 201 });
}
