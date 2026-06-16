import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { activityInputSchema } from "@/lib/workspaceSchemas";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const feedback = await prisma.counselorFeedback.findMany({
    where: { userId, targetType: "activity", visibility: "student" },
    orderBy: { createdAt: "desc" },
  });
  const byTarget = new Map<string, Array<{ id: string; content: string; createdAt: Date }>>();
  for (const f of feedback) {
    const existing = byTarget.get(f.targetId) ?? [];
    existing.push({ id: f.id, content: f.content, createdAt: f.createdAt });
    byTarget.set(f.targetId, existing);
  }
  return NextResponse.json({
    activities: activities.map((activity) => ({
      ...activity,
      counselorComments: byTarget.get(activity.id) ?? [],
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = activityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  }
  const activity = await prisma.activity.create({
    data: { ...parsed.data, userId: session.user.id },
  });
  return NextResponse.json({ activity }, { status: 201 });
}
