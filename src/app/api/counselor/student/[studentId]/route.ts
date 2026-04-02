import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { toStudentId } from "@/lib/studentId";

function computeReadiness(params: { essayCount: number; activityCount: number; gpa?: number | null; sat?: number | null; act?: number | null }) {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const essayScore = clamp(Math.round((params.essayCount / 8) * 100), 0, 100);
  const activityScore = clamp(Math.round((params.activityCount / 10) * 100), 0, 100);
  const gpaScore = params.gpa != null ? clamp(Math.round((params.gpa / 4) * 100), 0, 100) : 0;
  const testBase = params.sat != null ? Math.round((params.sat / 1600) * 100) : params.act != null ? Math.round((params.act / 36) * 100) : 0;
  const gradesScore = clamp(Math.round(gpaScore * 0.7 + testBase * 0.3), 0, 100);
  return {
    essayScore,
    activityScore,
    gradesScore,
    overall: Math.round((essayScore + activityScore + gradesScore) / 3),
  };
}

export async function GET(_: Request, ctx: { params: { studentId: string } }) {
  const want = ctx.params.studentId.toUpperCase();
  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  const profile = profiles.find((p) => toStudentId(p.id).toUpperCase() === want);
  if (!profile?.userId) {
    return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
  }

  const computedStudentId = toStudentId(profile.id);
  const uid = profile.userId;

  const [essays, activities, locker] = await Promise.all([
    prisma.essay.findMany({ where: { userId: uid }, orderBy: { updatedAt: "desc" } }),
    prisma.activity.findMany({ where: { userId: uid }, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({ where: { category: "Locker" }, orderBy: { updatedAt: "desc" } }),
  ]);

  const readiness = computeReadiness({
    essayCount: essays.length,
    activityCount: activities.length,
    gpa: profile.gpa,
    sat: profile.sat,
    act: profile.act,
  });

  return NextResponse.json({
    studentId: computedStudentId,
    profile,
    readiness,
    essays,
    activities,
    locker: locker.map((f) => ({
      id: f.id,
      title: f.title,
      updatedAt: f.updatedAt,
    })),
  });
}
