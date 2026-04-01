import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { activityInputSchema } from "@/lib/workspaceSchemas";

export async function PUT(req: Request, ctx: { params: { activityId: string } }) {
  const body = await req.json();
  const parsed = activityInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  const activity = await prisma.activity.update({
    where: { id: ctx.params.activityId },
    data: parsed.data,
  });
  return NextResponse.json({ activity });
}
