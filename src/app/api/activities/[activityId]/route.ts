import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { activityInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, ctx: { params: { activityId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await prisma.activity.findFirst({
    where: { id: ctx.params.activityId, userId: session.user.id },
  });
  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await req.json();
  const parsed = activityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  }
  const activity = await prisma.activity.update({
    where: { id: ctx.params.activityId },
    data: parsed.data,
  });
  return NextResponse.json({ activity });
}
