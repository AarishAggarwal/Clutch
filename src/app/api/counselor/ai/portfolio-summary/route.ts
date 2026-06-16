import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCounselorProfile, forbidden } from "@/lib/counselorAuth";
import { findStudentProfileByCode } from "@/lib/findStudentProfile";
import { computeReadiness } from "@/lib/counselorReadiness";
import { generatePortfolioSummary } from "@/server/portfolioSummaryService";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  studentId: z.string().min(3),
});

export async function POST(req: Request) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Student ID required." }, { status: 400 });
  }

  const profile = await findStudentProfileByCode(parsed.data.studentId);
  if (!profile?.userId) {
    return NextResponse.json({ error: "Student ID not found." }, { status: 404 });
  }

  const link = await prisma.counselorStudentLink.findUnique({
    where: {
      counselorId_studentProfileId: {
        counselorId: auth.profile.id,
        studentProfileId: profile.id,
      },
    },
  });
  if (!link) return forbidden();

  const uid = profile.userId;
  const [essays, activities, essayComments] = await Promise.all([
    prisma.essay.findMany({ where: { userId: uid }, orderBy: { updatedAt: "desc" } }),
    prisma.activity.findMany({ where: { userId: uid }, orderBy: { updatedAt: "desc" } }),
    prisma.essayComment.findMany({
      where: { essay: { userId: uid }, resolved: false, parentId: null },
      take: 20,
      select: { content: true, quotedText: true },
    }),
  ]);

  const readiness = computeReadiness({
    essayCount: essays.length,
    activityCount: activities.length,
    gpa: profile.gpa,
    sat: profile.sat,
    act: profile.act,
  });

  try {
    const summary = await generatePortfolioSummary({
      profile: profile as unknown as Record<string, unknown>,
      essays: essays.map((e) => ({
        title: e.title,
        essayType: e.essayType,
        status: e.status,
        wordCount: e.wordCount,
        content: e.content.slice(0, 3000),
      })),
      activities: activities.map((a) => ({
        title: a.title,
        category: a.category,
        role: a.role,
        description: a.description,
      })),
      comments: essayComments,
      readiness,
    });

    const saved = await prisma.aiSummary.create({
      data: {
        studentProfileId: profile.id,
        generatedById: auth.profile.id,
        summaryJson: JSON.stringify(summary),
      },
    });

    return NextResponse.json({
      summary,
      generatedAt: saved.createdAt,
    });
  } catch (e) {
    console.error("[portfolio-summary]", e);
    return NextResponse.json(
      { error: "Could not generate AI summary. Check GEMINI_API_KEY and try again." },
      { status: 502 },
    );
  }
}
