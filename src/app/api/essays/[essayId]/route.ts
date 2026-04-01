import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { essayInputSchema } from "@/lib/workspaceSchemas";

export async function PUT(req: Request, ctx: { params: { essayId: string } }) {
  const body = await req.json();
  const parsed = essayInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid essay payload." }, { status: 400 });
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
