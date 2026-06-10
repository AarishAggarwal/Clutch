import OpenAI from "openai";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });
  const system = `You are a senior college admissions counsellor reviewing a student's complete application portfolio.
Analyse the student's profile and return ONLY valid JSON (no markdown) with these fields:
executive_summary, academic_standing, ec_narrative, essay_readiness, college_list_balance,
top_strengths (array of 3 strings), priority_actions (array of 3 strings),
match_likelihood (object with school name keys and brief assessment values),
counsellor_notes_prompt (one question the counsellor should ask).
Be specific about the student's actual data. Do not use generic advice.`;

  const user = JSON.stringify(studentData, null, 2);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty AI response.");
  const parsed = JSON.parse(extractJsonObject(text)) as PortfolioSummaryJson;
  return parsed;
}
