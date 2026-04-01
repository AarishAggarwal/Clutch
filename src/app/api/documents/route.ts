import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { documentInputSchema } from "@/lib/workspaceSchemas";

export async function GET() {
  let documents = await prisma.document.findMany({ orderBy: { updatedAt: "desc" } });
  if (!documents.length) {
    await prisma.document.createMany({
      data: [
        {
          title: "College List Notes",
          category: "College Planning",
          content: "Reach: Stanford, MIT\nTarget: UIUC, Purdue\nSafety: ASU",
          tags: JSON.stringify(["list", "strategy"]),
        },
        {
          title: "Supplement Brainstorm - Community Prompt",
          category: "Supplemental Brainstorming",
          content: "Possible story angles:\n1) Debate mentorship\n2) Hospital volunteer communication moments",
          tags: JSON.stringify(["supplements", "brainstorm"]),
        },
      ],
    });
    documents = await prisma.document.findMany({ orderBy: { updatedAt: "desc" } });
  }
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = documentInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid document payload." }, { status: 400 });

  const document = await prisma.document.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      tags: JSON.stringify(parsed.data.tags ?? []),
    },
  });
  return NextResponse.json({ document }, { status: 201 });
}
