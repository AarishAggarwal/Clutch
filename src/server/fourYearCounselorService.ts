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
}): Promise<{ reply: string; modelName: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) throw new Error("Missing OPENAI_API_KEY");

  const modelName = process.env.OPENAI_COUNSELOR_MODEL ?? process.env.OPENAI_EVAL_MODEL ?? "gpt-4o-mini";

  const [profile, activities, essays, documents] = await Promise.all([
    prisma.studentProfile.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.activity.findMany({
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

  const client = new OpenAI({ apiKey });
  const res = await client.responses.create({
    model: modelName,
    input: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: userPayload },
    ],
    text: { verbosity: "low" },
    max_output_tokens: 1800,
  });

  const reply = ((res as any).output_text as string | undefined)?.trim();
  if (!reply) throw new Error("OpenAI returned empty counselor reply.");
  return { reply, modelName };
}

