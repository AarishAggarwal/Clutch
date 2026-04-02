import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { evaluateEssayWithProviders } from "@/server/providerOrchestrator";
import { saveEssayEvaluation } from "@/server/chatPersistence";
import { evaluateEssayRequestSchema } from "@/lib/chatSchemas";
import { prisma } from "@/server/prisma";
import { authOptions } from "@/lib/auth";

function computeEssayTitle(params: {
  essayType: string;
  title?: string;
  essayText: string;
  supplementalUniversityName?: string;
  supplementalPromptQuestion?: string;
  supplementalPromptCycleYear?: string;
}) {
  if (
    params.essayType === "supplemental_essay" &&
    params.supplementalUniversityName &&
    params.supplementalPromptQuestion
  ) {
    const promptShort = params.supplementalPromptQuestion.slice(0, 70);
    const year = params.supplementalPromptCycleYear ? ` (${params.supplementalPromptCycleYear})` : "";
    return `${params.supplementalUniversityName} - ${promptShort}${year}`.slice(0, 200);
  }
  const t = params.title?.trim();
  if (t) return t.slice(0, 200);
  const firstLine = params.essayText.trim().split(/\r?\n/)[0]?.trim();
  if (firstLine) return firstLine.slice(0, 80);
  return `${params.essayType} review`;
}

export async function POST(
  req: Request,
  ctx: { params: { conversationId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { conversationId } = ctx.params;
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = evaluateEssayRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const essayText = parsed.data.content.trim();
    if (!essayText) {
      return NextResponse.json({ error: "Essay content cannot be empty." }, { status: 400 });
    }

    const computedTitle = computeEssayTitle({
      essayType: parsed.data.essayType,
      title: parsed.data.title,
      essayText,
      supplementalUniversityName: parsed.data.supplementalUniversityName,
      supplementalPromptQuestion: parsed.data.supplementalPromptQuestion,
      supplementalPromptCycleYear: parsed.data.supplementalPromptCycleYear,
    });

    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        title: true,
        category: true,
        organization: true,
        role: true,
        grades: true,
        hoursPerWeek: true,
        weeksPerYear: true,
        description: true,
        achievementNotes: true,
      },
    });

    const activitiesContext =
      activities.length === 0
        ? undefined
        : activities
            .map((a, i) =>
              [
                `${i + 1}. ${a.title} (${a.category})`,
                `   Organization: ${a.organization || "N/A"} | Role: ${a.role || "N/A"} | Grades: ${a.grades || "N/A"}`,
                `   Time: ${a.hoursPerWeek} hrs/week, ${a.weeksPerYear} weeks/year`,
                `   Description: ${a.description || "N/A"}`,
                `   Impact/Recognition: ${a.achievementNotes || "N/A"}`,
              ].join("\n"),
            )
            .join("\n");

    const evaluation = await evaluateEssayWithProviders({
      essayType: parsed.data.essayType,
      essayText,
      supplementalContext:
        parsed.data.essayType === "supplemental_essay"
          ? {
              universityName: parsed.data.supplementalUniversityName ?? "",
              promptQuestion: parsed.data.supplementalPromptQuestion ?? "",
              cycleYear: parsed.data.supplementalPromptCycleYear ?? "",
            }
          : undefined,
      activitiesContext,
    });

    await saveEssayEvaluation({
      conversationId,
      essayType: parsed.data.essayType,
      essayTitle: parsed.data.title,
      essayContent: essayText,
      supplementalUniversityId: parsed.data.supplementalUniversityId,
      supplementalUniversityName: parsed.data.supplementalUniversityName,
      supplementalPromptId: parsed.data.supplementalPromptId,
      supplementalPromptQuestion: parsed.data.supplementalPromptQuestion,
      supplementalPromptCycleYear: parsed.data.supplementalPromptCycleYear,
      computedTitle,
      mode: evaluation.mode,
      fusedJson: evaluation.fusedJson,
      agreementSummary: evaluation.agreementSummary,
      disagreementFlags: evaluation.disagreementFlags,
      openaiResult: evaluation.openaiResult
        ? {
            modelName: evaluation.openaiResult.modelName,
            rawJson: evaluation.openaiResult.rawJson,
            parsedJson: evaluation.openaiResult.parsedJson,
          }
        : undefined,
      claudeResult: evaluation.claudeResult
        ? {
            modelName: evaluation.claudeResult.modelName,
            rawJson: evaluation.claudeResult.rawJson,
            parsedJson: evaluation.claudeResult.parsedJson,
          }
        : undefined,
    });

    return NextResponse.json({
      ok: true,
      fused: evaluation.fusedJson,
      agreementSummary: evaluation.agreementSummary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Evaluation failed.", details: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
