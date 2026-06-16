import OpenAI from "openai";
import { prisma } from "@/server/prisma";

type ChatTurn = { role: "user" | "assistant"; content: string };

function inferGradeLevel(graduationYear: number | null | undefined): string {
  if (!graduationYear) return "unknown";
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  // School-year boundary approximation: after July, next graduating cohort increments.
  const seniorClassYear = month >= 7 ? currentYear + 1 : currentYear;
  const delta = graduationYear - seniorClassYear;
  if (delta <= 0) return "senior";
  if (delta === 1) return "junior";
  if (delta === 2) return "sophomore";
  if (delta === 3) return "freshman";
  return "middle_school_or_early_high_school";
}

function buildSystemPrompt() {
  return [
    "You are a premium 4-year college admissions counselor for ambitious students.",
    "You provide practical, personalized advice grounded ONLY in provided student data.",
    "You must adapt guidance by grade level:",
    "- Freshman: exploration, habits, curiosity breadth, trying rigorous areas.",
    "- Sophomore: focus formation, skill-building depth, early leadership and sustained commitments.",
    "- Junior: building signature work, impact evidence, testing strategy, recommendation readiness.",
    "- Senior: writing strategy, application execution, narrative polish, deadlines and fit.",
    "Be direct, specific, and encouraging. Avoid generic motivational fluff.",
    "Use concise sections and clear next steps. Mention trade-offs where relevant.",
    "If data is missing, explicitly state assumptions and ask targeted follow-up questions.",
    "Do not fabricate achievements or background details.",
  ].join("\n");
}

export async function getCounselorReply(params: {
  userMessage: string;
  history: ChatTurn[];
  userId: string;
  mode: "general" | "activities";
}): Promise<{ reply: string; modelName: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey?.trim() && !geminiKey?.trim()) {
    const starter =
      params.mode === "activities"
        ? "Activity review mode: share role, impact, and time commitment for each item."
        : "General counselor mode: share grade, intended majors, and current priorities.";
    return {
      modelName: "fallback-local",
      reply: `${starter}\n\nI can still help without AI: based on your message, focus on one concrete action this week, one measurable outcome, and one missing data point to complete.`,
    };
  }

  const groqModelName = process.env.GROQ_COUNSELOR_MODEL ?? "openai/gpt-oss-20b";
  const geminiModelName = process.env.GEMINI_COUNSELOR_MODEL ?? "gemini-2.0-flash-lite";

  const [profile, activities, essays, documents] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: params.userId } }),
    prisma.activity.findMany({
      where: { userId: params.userId },
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
    }),
    prisma.essay.findMany({
      where: { userId: params.userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { title: true, essayType: true, status: true, wordCount: true, notes: true },
    }),
    prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { title: true, category: true, tags: true },
    }),
  ]);

  const inferredGrade = inferGradeLevel(profile?.graduationYear);
  const activityHoursPerYear = activities.reduce((sum, a) => sum + a.hoursPerWeek * a.weeksPerYear, 0);

  const profileBlock = [
    `Name: ${profile?.fullName ?? "unknown"}`,
    `School: ${profile?.schoolName ?? "unknown"}`,
    `Graduation year: ${profile?.graduationYear ?? "unknown"}`,
    `Inferred grade level: ${inferredGrade}`,
    `Intended majors: ${profile?.intendedMajors ?? "unknown"}`,
    `Interests: ${profile?.interests ?? "unknown"}`,
    `Location: ${profile?.location ?? "unknown"}`,
    `GPA: ${profile?.gpa ?? "unknown"} | SAT: ${profile?.sat ?? "unknown"} | ACT: ${profile?.act ?? "unknown"}`,
    `Coursework summary: ${profile?.courseworkSummary ?? "unknown"}`,
    `Profile notes: ${profile?.notes ?? "none"}`,
  ].join("\n");

  const activitiesBlock =
    activities.length === 0
      ? "No activities saved."
      : activities
          .map(
            (a, i) =>
              `${i + 1}. ${a.title} (${a.category}) | ${a.role} @ ${a.organization} | ${a.grades} | ${a.hoursPerWeek}h/wk x ${a.weeksPerYear}w/yr\n   Description: ${a.description}\n   Impact: ${a.achievementNotes ?? "N/A"}`,
          )
          .join("\n");

  const essaysBlock =
    essays.length === 0
      ? "No essays saved."
      : essays
          .map(
            (e, i) =>
              `${i + 1}. ${e.title} | type=${e.essayType} | status=${e.status} | words=${e.wordCount}${e.notes ? ` | notes=${e.notes}` : ""}`,
          )
          .join("\n");

  const docsBlock =
    documents.length === 0
      ? "No documents saved."
      : documents.map((d, i) => `${i + 1}. ${d.title} | ${d.category} | tags=${d.tags}`).join("\n");

  const userPayload = [
    "STUDENT DATA CONTEXT:",
    profileBlock,
    "",
    `Activity summary: ${activities.length} saved activities | Approx annual activity hours: ${Math.round(activityHoursPerYear)}`,
    activitiesBlock,
    "",
    `Essay summary: ${essays.length} saved essays`,
    essaysBlock,
    "",
    `Document summary: ${documents.length} saved docs`,
    docsBlock,
    "",
    "RECENT CHAT HISTORY:",
    ...(params.history.length
      ? params.history.slice(-14).map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      : ["(none)"]),
    "",
    "STUDENT MESSAGE:",
    params.userMessage,
    "",
    "Response format:",
    "- Start with 1 short diagnosis line.",
    "- Then provide exactly 3 sections: (1) What to focus on now (2) Next 6-8 weeks plan (3) Risks to avoid.",
    "- End with 3 concrete action items for this week.",
  ].join("\n");

  if (groqKey?.trim()) {
    const client = new OpenAI({
      apiKey: groqKey,
      baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
    });
    try {
      const res = await client.responses.create({
        model: groqModelName,
        input: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: userPayload },
        ],
      });
      const reply = ((res as any).output_text as string | undefined)?.trim();
      if (reply) return { reply, modelName: groqModelName };
    } catch {
      // fall through to Gemini
    }
  }

  if (geminiKey?.trim()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModelName)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ role: "user", parts: [{ text: userPayload }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 1800 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini counselor request failed (${res.status}).`);
    const json: any = await res.json();
    const reply = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
    if (reply) return { reply, modelName: geminiModelName };
  }

  throw new Error("No AI provider returned a counselor reply.");
}

