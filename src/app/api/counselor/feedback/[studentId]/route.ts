import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCounselorProfile, forbidden } from "@/lib/counselorAuth";
import { findStudentProfileByCode } from "@/lib/findStudentProfile";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  targetType: z.enum(["essay", "activity"]),
  targetId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export async function GET(_: Request, ctx: { params: { studentId: string } }) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const profile = await findStudentProfileByCode(ctx.params.studentId);
  if (!profile?.userId) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const link = await prisma.counselorStudentLink.findUnique({
    where: { counselorId_studentProfileId: { counselorId: auth.profile.id, studentProfileId: profile.id } },
  });
  if (!link) return forbidden();

  const feedback = await prisma.counselorFeedback.findMany({
    where: { counselorId: auth.profile.id, studentProfileId: profile.id, visibility: "student" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedback });
}

export async function POST(req: Request, ctx: { params: { studentId: string } }) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const profile = await findStudentProfileByCode(ctx.params.studentId);
  if (!profile?.userId) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const link = await prisma.counselorStudentLink.findUnique({
    where: { counselorId_studentProfileId: { counselorId: auth.profile.id, studentProfileId: profile.id } },
  });
  if (!link) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback payload." }, { status: 400 });

  const feedback = await prisma.counselorFeedback.create({
    data: {
      counselorId: auth.profile.id,
      studentProfileId: profile.id,
      userId: profile.userId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      content: parsed.data.content.trim(),
      visibility: "student",
    },
  });

  await prisma.notification.create({
    data: {
      userId: profile.userId,
      title: parsed.data.targetType === "essay" ? "New essay comment from counselor" : "New activity comment from counselor",
      body: parsed.data.content.trim().slice(0, 180),
      type: "counselor_feedback",
      link: parsed.data.targetType === "essay" ? "/essays" : "/activities",
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}
