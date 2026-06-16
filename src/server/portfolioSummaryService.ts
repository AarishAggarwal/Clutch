import { sanitizeJsonStrings } from "@/server/plainText";

export type PortfolioSummaryJson = {
  executive_summary: string;
  academic_standing: string;
  ec_narrative: string;
  essay_readiness: string;
  college_list_balance: string;
  top_strengths: string[];
  priority_actions: string[];
  match_likelihood: Record<string, string>;
  counsellor_notes_prompt: string;
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

export async function generatePortfolioSummary(studentData: {
  profile: Record<string, unknown>;
  essays: Array<{ title: string; essayType: string; status: string; wordCount: number; content?: string }>;
  activities: Array<{ title: string; category: string; role: string; description: string }>;
  readiness: { overall: number };
}): Promise<PortfolioSummaryJson> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const profile = studentData.profile as { gpa?: number | null; sat?: number | null; act?: number | null };
    const missing: string[] = [];
    if (profile.gpa == null) missing.push("GPA");
    if (profile.sat == null && profile.act == null) missing.push("SAT/ACT");
    if (!studentData.essays.length) missing.push("essay drafts");
    if (!studentData.activities.length) missing.push("activities");
    return sanitizeJsonStrings({
      executive_summary: `Current readiness is ${studentData.readiness.overall}%. This summary is based only on counselor-visible profile, essays, and activities.`,
      academic_standing: profile.gpa == null ? "Academic metrics are incomplete (missing GPA)." : "Academic baseline is present and should be contextualized with rigor.",
      ec_narrative: studentData.activities.length ? "Activities show early narrative potential; focus on sustained impact and leadership evidence." : "No activities are filled yet.",
      essay_readiness: studentData.essays.length ? "Essays are started; next step is clearer personal positioning and stronger specificity." : "No essays are filled yet.",
      college_list_balance: "List balance cannot be fully judged yet; refine after profile and writing are complete.",
      top_strengths: ["Work-in-progress portfolio", "Counselor visibility enabled", "Actionable next steps identified"],
      priority_actions: missing.length ? missing.map((m) => `Complete ${m}.`) : ["Refine activity impact bullets.", "Improve essay specificity.", "Finalize testing strategy."],
      match_likelihood: { "Current estimate": "Insufficient complete data. Complete missing sections for a more realistic view." },
      counsellor_notes_prompt: missing.length ? `Which missing area can you complete first: ${missing.join(", ")}?` : "Which section feels least complete to you right now?",
    });
  }

  const system = `You are a senior college admissions counsellor reviewing a student's portfolio.
Analyse the student's profile and return ONLY valid JSON (no markdown) with these fields:
executive_summary, academic_standing, ec_narrative, essay_readiness, college_list_balance,
top_strengths (array of 3 strings), priority_actions (array of 3 strings),
match_likelihood (object with school name keys and brief assessment values),
counsellor_notes_prompt (one question the counsellor should ask).
Use ONLY provided data. Do not hallucinate missing facts.
If data is missing, explicitly call it out and treat it as "not completed yet".
Do not use markdown symbols, asterisks, pipes, tables, or headings.`;

  const user = JSON.stringify(studentData, null, 2);

  const model = process.env.GEMINI_SUMMARY_MODEL?.trim() || "gemini-2.0-flash-lite";
  const completion = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2200,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!completion.ok) throw new Error(`Gemini summary request failed (${completion.status})`);
  const data: any = await completion.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
  if (!text) throw new Error("Empty AI response.");
  const parsed = JSON.parse(extractJsonObject(text)) as PortfolioSummaryJson;
  return sanitizeJsonStrings(parsed);
}
