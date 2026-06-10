import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCounselorProfile } from "@/lib/counselorAuth";
import { findStudentProfileByCode } from "@/lib/findStudentProfile";
import { computeReadiness, studentStatus } from "@/lib/counselorReadiness";
import { toStudentId } from "@/lib/studentId";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  studentId: z.string().min(3),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function GET() {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const links = await prisma.counselorStudentLink.findMany({
    where: { counselorId: auth.profile.id, status: "active" },
    include: { studentProfile: true },
    orderBy: { linkedAt: "desc" },
  });

  const students = await Promise.all(
    links.map(async (link) => {
      const profile = link.studentProfile;
      const uid = profile.userId;
      const [essayCount, activityCount] = uid
        ? await Promise.all([
            prisma.essay.count({ where: { userId: uid } }),
            prisma.activity.count({ where: { userId: uid } }),
          ])
        : [0, 0];
      const readiness = computeReadiness({
        essayCount,
        activityCount,
        gpa: profile.gpa,
        sat: profile.sat,
        act: profile.act,
      });
      return {
        linkId: link.id,
        studentId: toStudentId(profile.id),
        profile,
        readiness,
        status: studentStatus(readiness.overall),
        linkedAt: link.linkedAt,
      };
    }),
  );

  return NextResponse.json({ students, studentIds: students.map((s) => s.studentId) });
}

export async function POST(req: Request) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = parsed.data.studentId.trim().toUpperCase();

  if (parsed.data.action === "remove") {
    const profile = await findStudentProfileByCode(code);
    if (!profile) {
      return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
    }
    await prisma.counselorStudentLink.deleteMany({
      where: { counselorId: auth.profile.id, studentProfileId: profile.id },
    });
    const links = await prisma.counselorStudentLink.findMany({
      where: { counselorId: auth.profile.id, status: "active" },
      include: { studentProfile: true },
    });
    return NextResponse.json({
      studentIds: links.map((l) => toStudentId(l.studentProfile.id)),
    });
  }

  const currentCount = await prisma.counselorStudentLink.count({
    where: { counselorId: auth.profile.id, status: "active" },
  });
  if (currentCount >= auth.profile.maxStudents) {
    return NextResponse.json(
      { error: `Roster limit reached (${auth.profile.maxStudents} students).` },
      { status: 400 },
    );
  }

  const studentProfile = await findStudentProfileByCode(code);
  if (!studentProfile?.userId) {
    return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
  }

  const existing = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: {
        counselorId: auth.profile.id,
        studentProfileId: studentProfile.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({
      ok: true,
      studentId: toStudentId(studentProfile.id),
      alreadyLinked: true,
      preview: {
        fullName: studentProfile.fullName,
        schoolName: studentProfile.schoolName,
        graduationYear: studentProfile.graduationYear,
      },
    });
  }

  await prisma.counselorStudentLink.create({
    data: {
      counselorId: auth.profile.id,
      studentProfileId: studentProfile.id,
      status: "active",
    },
  });

  return NextResponse.json({
    ok: true,
    studentId: toStudentId(studentProfile.id),
    preview: {
      fullName: studentProfile.fullName,
      schoolName: studentProfile.schoolName,
      graduationYear: studentProfile.graduationYear,
    },
  });
}

/** Preview a student code without linking (used by add-student flow). */
export async function PATCH(req: Request) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const body = (await req.json().catch(() => null)) as { studentId?: string } | null;
  const code = body?.studentId?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Student ID required." }, { status: 400 });
  }

  const studentProfile = await findStudentProfileByCode(code);
  if (!studentProfile?.userId) {
    return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
  }

  const alreadyLinked = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: {
        counselorId: auth.profile.id,
        studentProfileId: studentProfile.id,
      },
    },
  });

  return NextResponse.json({
    studentId: toStudentId(studentProfile.id),
    preview: {
      fullName: studentProfile.fullName,
      schoolName: studentProfile.schoolName,
      graduationYear: studentProfile.graduationYear,
      location: studentProfile.location,
      intendedMajors: studentProfile.intendedMajors,
    },
    alreadyOnRoster: Boolean(alreadyLinked),
  });
}
