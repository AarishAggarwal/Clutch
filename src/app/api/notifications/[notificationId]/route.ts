import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/prisma";

export async function PATCH(_: Request, ctx: { params: { notificationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await prisma.notification.updateMany({
    where: { id: ctx.params.notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });
  if (!updated.count) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
