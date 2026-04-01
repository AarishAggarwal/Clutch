import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function DELETE(_: Request, ctx: { params: { fileId: string } }) {
  try {
    await prisma.document.delete({ where: { id: ctx.params.fileId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Delete failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

