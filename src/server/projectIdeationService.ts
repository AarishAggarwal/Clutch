import OpenAI from "openai";
import {
  chatCompletionCreateFlexible,
  chatCompletionMessageText,
  extractResponsesOutputText,
} from "@/server/openaiResponseText";

const SYSTEM_PROMPT = `You are a creative project ideation partner for ambitious high school students building extracurricular projects, inventions, research, nonprofits, or art.

Your job is to help ideas feel innovative and a little unconventional—without being gimmicky. Push for clarity, novelty, real-world impact, and a credible path to execution.

Guidelines:
- Ask sharp follow-up questions; challenge vague assumptions kindly.
- Offer 2–3 unexpected angles (analogies, constraints, “what if” pivots) when useful.
- Suggest milestones, risks, and ways to stand out in competitions or college narratives—only when relevant.
- Keep responses focused and energetic; avoid generic praise.
- Never write a full college essay draft unless they explicitly ask for application wording; prefer structure and bullets when listing ideas.`;

export type IdeationTurn = { role: "user" | "assistant"; content: string };

function mockIdeationReply(history: IdeationTurn[]): string {
  const last = history.filter((h) => h.role === "user").pop()?.content?.slice(0, 200) ?? "";
  return [
    "Here’s a sharper frame: what if you constrained the idea to one week and $20—what’s the smallest impressive demo?",
    last ? `Building on “${last.slice(0, 80)}…”, what audience would pay attention first: peers, a teacher-sponsor, or an online community?` : "What’s the one moment you want a reader to remember?",
    "Try naming three failure modes (technical, adoption, time)—then we’ll pick which to design against first.",
  ].join("\n\n");
}

export async function generateProjectIdeationReply(history: IdeationTurn[]): Promise<{ text: string; modelName: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqModel = process.env.GROQ_PROJECT_MODEL ?? "openai/gpt-oss-20b";
  const geminiModel = process.env.GEMINI_PROJECT_MODEL ?? "gemini-2.0-flash-lite";

  if (!groqKey?.trim() && !geminiKey?.trim()) {
    return { text: mockIdeationReply(history), modelName: "mock-local" };
  }

  const input = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content })),
  ];

  if (groqKey?.trim()) {
    const client = new OpenAI({
      apiKey: groqKey,
      baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
    });
    try {
      const res = await client.responses.create({
        model: groqModel,
        input,
        max_output_tokens: 1800,
      });
      const text = extractResponsesOutputText(res);
      if (text) return { text, modelName: groqModel };
    } catch {
      // fall through
    }

    const chatRes = await chatCompletionCreateFlexible(client, {
      model: groqModel,
      messages: input.map((m) => ({ role: m.role, content: m.content })),
      max_completion_tokens: 1800,
    });
    const text = chatCompletionMessageText(chatRes.choices[0]?.message);
    if (text) return { text, modelName: groqModel };
  }

  if (geminiKey?.trim()) {
    const flattened = input.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: flattened }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 1800 },
      }),
    });
    if (res.ok) {
      const json: any = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
      if (text) return { text, modelName: geminiModel };
    }
  }

  return { text: "I couldn’t generate a reply—try sending a shorter message.", modelName: "fallback-local" };
}
