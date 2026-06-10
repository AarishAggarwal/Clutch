import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCounselorProfile, forbidden } from "@/lib/counselorAuth";
import { findStudentProfileByCode } from "@/lib/findStudentProfile";
import { prisma } from "@/server/prisma";

const noteSchema = z.object({
  content: z.string().min(1).max(5000),
  sessionDate: z.string().optional(),
  durationMinutes: z.number().int().min(0).max(480).optional(),
  topics: z.string().max(500).optional(),
  actionItems: z.string().max(1000).optional(),
});

export async function GET(_: Request, ctx: { params: { studentId: string } }) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const profile = await findStudentProfileByCode(ctx.params.studentId);
  if (!profile) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const link = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: {
        counselorId: auth.profile.id,
        studentProfileId: profile.id,
      },
    },
  });
  if (!link) return forbidden();

  const notes = await prisma.counselorNote.findMany({
    where: { counselorId: auth.profile.id, studentProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request, ctx: { params: { studentId: string } }) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const profile = await findStudentProfileByCode(ctx.params.studentId);
  if (!profile) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const link = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: {
        counselorId: auth.profile.id,
        studentProfileId: profile.id,
      },
    },
  });
  if (!link) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note." }, { status: 400 });
  }

  const note = await prisma.counselorNote.create({
    data: {
      counselorId: auth.profile.id,
      studentProfileId: profile.id,
      content: parsed.data.content,
      sessionDate: parsed.data.sessionDate ? new Date(parsed.data.sessionDate) : undefined,
      durationMinutes: parsed.data.durationMinutes,
      topics: parsed.data.topics,
      actionItems: parsed.data.actionItems,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
