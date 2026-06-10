import { NextResponse } from "next/server";
import { requireCounselorProfile, forbidden } from "@/lib/counselorAuth";
import { findStudentProfileByCode } from "@/lib/findStudentProfile";
import { computeReadiness } from "@/lib/counselorReadiness";
import { toStudentId } from "@/lib/studentId";
import { prisma } from "@/server/prisma";

async function ensureLinked(counselorId: string, studentProfileId: string) {
  const link = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: { counselorId, studentProfileId },
    },
  });
  return Boolean(link);
}

export async function GET(_: Request, ctx: { params: { studentId: string } }) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const profile = await findStudentProfileByCode(ctx.params.studentId);
  if (!profile?.userId) {
    return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
  }

  const linked = await ensureLinked(auth.profile.id, profile.id);
  if (!linked) {
    return forbidden();
  }

  const computedStudentId = toStudentId(profile.id);
  const uid = profile.userId;

  const [essays, activities, latestSummary] = await Promise.all([
    prisma.essay.findMany({
      where: { userId: uid },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        essayType: true,
        status: true,
        wordCount: true,
        content: true,
        updatedAt: true,
        notes: true,
      },
    }),
    prisma.activity.findMany({ where: { userId: uid }, orderBy: { updatedAt: "desc" } }),
    prisma.aiSummary.findFirst({
      where: { studentProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const locker = await prisma.document.findMany({
    where: { category: "Locker" },
    orderBy: { updatedAt: "desc" },
  });

  const readiness = computeReadiness({
    essayCount: essays.length,
    activityCount: activities.length,
    gpa: profile.gpa,
    sat: profile.sat,
    act: profile.act,
  });

  let aiSummary = null;
  if (latestSummary) {
    try {
      aiSummary = {
        ...JSON.parse(latestSummary.summaryJson),
        generatedAt: latestSummary.createdAt,
      };
    } catch {
      aiSummary = null;
    }
  }

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
    aiSummary,
  });
}
