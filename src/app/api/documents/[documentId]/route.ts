import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { documentInputSchema } from "@/lib/workspaceSchemas";

export async function PUT(req: Request, ctx: { params: { documentId: string } }) {
  const body = await req.json();
  const parsed = documentInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid document payload." }, { status: 400 });
  const document = await prisma.document.update({
    where: { id: ctx.params.documentId },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      tags: JSON.stringify(parsed.data.tags ?? []),
    },
  });
  return NextResponse.json({ document });
}
