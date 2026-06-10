import { NextResponse } from "next/server";
import { requireCounselorProfile } from "@/lib/counselorAuth";
import { computeReadiness, studentStatus } from "@/lib/counselorReadiness";
import { toStudentId } from "@/lib/studentId";
import { prisma } from "@/server/prisma";

export async function GET() {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const links = await prisma.counselorStudentLink.findMany({
    where: { counselorId: auth.profile.id, status: "active" },
    include: { studentProfile: true },
  });

  const studentUserIds = links.map((l) => l.studentProfile.userId).filter((id): id is string => Boolean(id));

  const essaysInReview = studentUserIds.length
    ? await prisma.essay.count({
        where: { userId: { in: studentUserIds }, status: "in_review" },
      })
    : 0;

  const submittedEssays = studentUserIds.length
    ? await prisma.essay.count({
        where: { userId: { in: studentUserIds }, status: "submitted" },
      })
    : 0;

  const attentionList = await Promise.all(
    links.map(async (link) => {
      const profile = link.studentProfile;
      const uid = profile.userId!;
      const [essayCount, activityCount, pendingReview] = await Promise.all([
        prisma.essay.count({ where: { userId: uid } }),
        prisma.activity.count({ where: { userId: uid } }),
        prisma.essay.count({ where: { userId: uid, status: "in_review" } }),
      ]);
      const readiness = computeReadiness({
        essayCount,
        activityCount,
        gpa: profile.gpa,
        sat: profile.sat,
        act: profile.act,
      });
      const status = studentStatus(readiness.overall);
      const urgency =
        (readiness.overall < 60 ? 30 : 0) + pendingReview * 10 + (100 - readiness.overall);
      return {
        studentId: toStudentId(profile.id),
        fullName: profile.fullName,
        schoolName: profile.schoolName,
        readiness: readiness.overall,
        status,
        pendingReview,
        urgency,
      };
    }),
  );

  attentionList.sort((a, b) => b.urgency - a.urgency);

  const reviewQueue = studentUserIds.length
    ? await prisma.essay.findMany({
        where: { userId: { in: studentUserIds }, status: "in_review" },
        orderBy: { updatedAt: "asc" },
        take: 10,
        select: {
          id: true,
          title: true,
          essayType: true,
          wordCount: true,
          updatedAt: true,
          userId: true,
        },
      })
    : [];

  const connectDocs = await prisma.document.findMany({
    where: { category: "MarketplaceConnectRequest" },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const connectRequests = connectDocs
    .map((d) => {
      try {
        return JSON.parse(d.content) as {
          requestId: string;
          specialistName: string;
          studentId: string;
          studentName: string;
          createdAt: string;
        };
      } catch {
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const rosterIds = new Set(links.map((l) => toStudentId(l.studentProfile.id)));
  const filteredConnect = connectRequests.filter((r) => rosterIds.has(r.studentId));

  return NextResponse.json({
    stats: {
      totalStudents: links.length,
      essaysPendingReview: essaysInReview,
      applicationsSubmitted: submittedEssays,
      maxStudents: auth.profile.maxStudents,
    },
    studentsNeedingAttention: attentionList.slice(0, 5),
    essayReviewQueue: reviewQueue,
    connectRequests: filteredConnect,
    onboardingComplete: auth.profile.onboardingComplete,
  });
}
