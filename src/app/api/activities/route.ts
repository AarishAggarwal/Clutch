import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { activityInputSchema } from "@/lib/workspaceSchemas";

export async function GET() {
  let activities = await prisma.activity.findMany({ orderBy: { updatedAt: "desc" } });
  if (!activities.length) {
    await prisma.activity.createMany({
      data: [
        {
          title: "Debate Team Captain",
          category: "Leadership",
          organization: "Lincoln High Debate",
          role: "Captain",
          grades: "10-12",
          hoursPerWeek: 6,
          weeksPerYear: 34,
          description: "Led varsity debate prep and weekly drills.",
          achievementNotes: "State semifinalist; mentored 7 novice debaters.",
        },
        {
          title: "Hospital Volunteer",
          category: "Service",
          organization: "Valley Health",
          role: "Volunteer",
          grades: "11-12",
          hoursPerWeek: 4,
          weeksPerYear: 30,
          description: "Supported patient intake and logistics desk.",
          achievementNotes: "120+ volunteer hours.",
        },
      ],
    });
    activities = await prisma.activity.findMany({ orderBy: { updatedAt: "desc" } });
  }
  return NextResponse.json({ activities });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = activityInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  const activity = await prisma.activity.create({ data: parsed.data });
  return NextResponse.json({ activity }, { status: 201 });
}
