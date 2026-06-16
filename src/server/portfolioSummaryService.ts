import { sanitizeJsonStrings } from "@/server/plainText";

export type PortfolioSummaryJson = {
  academic_overview: string;
  extracurricular_overview: string;
  strengths: string[];
  weaknesses: string[];
  college_readiness: string;
  recommended_next_steps: string[];
  /** @deprecated legacy fields kept for backward compatibility */
  executive_summary?: string;
  academic_standing?: string;
  ec_narrative?: string;
  essay_readiness?: string;
  college_list_balance?: string;
  top_strengths?: string[];
  priority_actions?: string[];
  match_likelihood?: Record<string, string>;
  counsellor_notes_prompt?: string;
};

function extractJsonObject(text: string): string {
  const cleaned = text.trim().replace(/```json/gi, "```").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response.");
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallbackSummary(studentData: {
  profile: Record<string, unknown>;
  essays: unknown[];
  activities: unknown[];
  readiness: { overall: number };
}): PortfolioSummaryJson {
  const profile = studentData.profile as { gpa?: number | null; sat?: number | null; act?: number | null };
  const missing: string[] = [];
  if (profile.gpa == null) missing.push("GPA");
  if (profile.sat == null && profile.act == null) missing.push("SAT/ACT");
  if (!studentData.essays.length) missing.push("essay drafts");
  if (!studentData.activities.length) missing.push("activities");

  return sanitizeJsonStrings({
    academic_overview:
      profile.gpa == null
        ? "Academic metrics are incomplete. GPA and testing should be added for a full picture."
        : `GPA is on file (${profile.gpa}). Contextualize with course rigor and board system.`,
    extracurricular_overview: studentData.activities.length
      ? "Activities are present. Focus on depth, leadership, and measurable impact."
      : "No activities recorded yet.",
    strengths: ["Engaged with counselor workflow", "Portfolio data partially complete", "Clear next steps available"],
    weaknesses: missing.length ? missing.map((m) => `Missing ${m}`) : ["Needs sharper essay positioning", "List balance not yet assessed"],
    college_readiness: `Overall readiness estimate: ${studentData.readiness.overall}%. Complete missing sections to improve accuracy.`,
    recommended_next_steps: missing.length
      ? missing.map((m) => `Complete ${m}.`)
      : ["Refine activity impact bullets.", "Strengthen essay specificity.", "Finalize testing strategy."],
    executive_summary: `Readiness ${studentData.readiness.overall}% based on profile, essays, and activities.`,
    top_strengths: ["Work-in-progress portfolio", "Counselor visibility enabled"],
    priority_actions: missing.length ? missing.map((m) => `Complete ${m}.`) : ["Refine essays.", "Deepen EC narrative."],
  });
}

export async function generatePortfolioSummary(studentData: {
  profile: Record<string, unknown>;
  essays: Array<{ title: string; essayType: string; status: string; wordCount: number; content?: string }>;
  activities: Array<{ title: string; category: string; role: string; description: string }>;
  comments?: Array<{ content: string; quotedText?: string }>;
  readiness: { overall: number };
}): Promise<PortfolioSummaryJson> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackSummary(studentData);

  const system = `You are a senior college admissions counsellor reviewing a student's portfolio.
Return ONLY valid JSON with these fields:
academic_overview (string),
extracurricular_overview (string),
strengths (array of 3 strings),
weaknesses (array of 3 strings),
college_readiness (string),
recommended_next_steps (array of 3 strings).
Use ONLY provided data. Do not hallucinate. Call out missing data explicitly.
Plain text only inside strings. No markdown, asterisks, pipes, or headings.`;

  const user = JSON.stringify(studentData, null, 2);
  const model = process.env.GEMINI_SUMMARY_MODEL?.trim() || "gemini-2.0-flash-lite";
  const completion = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 2200, responseMimeType: "application/json" },
      }),
    },
  );
  if (!completion.ok) throw new Error(`Gemini summary request failed (${completion.status})`);
  const data: any = await completion.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
  if (!text) throw new Error("Empty AI response.");
  const parsed = JSON.parse(extractJsonObject(text)) as PortfolioSummaryJson;
  return sanitizeJsonStrings(parsed);
}
