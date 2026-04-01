import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(_: Request, ctx: { params: { fileId: string } }) {
  const doc = await prisma.document.findUnique({ where: { id: ctx.params.fileId } });
  if (!doc || doc.category !== "Locker") {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  try {
    const payload = JSON.parse(doc.content) as {
      filename: string;
      mimeType: string;
      size: number;
      data: string;
      uploadedAt?: string;
    };
    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      payload,
    });
  } catch {
    return NextResponse.json({ error: "Malformed locker payload." }, { status: 500 });
  }
}

