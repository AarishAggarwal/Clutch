import OpenAI from "openai";

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
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_PROJECT_MODEL ?? process.env.OPENAI_EVAL_MODEL ?? "gpt-4o-mini";

  if (!apiKey?.trim()) {
    return { text: mockIdeationReply(history), modelName: "mock-local" };
  }

  const client = new OpenAI({ apiKey });
  const res = await client.responses.create({
    model: modelName,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
    ],
    max_output_tokens: 1800,
    text: {
      verbosity: "low",
    },
  });

  const text = ((res as any).output_text as string | undefined)?.trim();
  if (!text) {
    return { text: "I couldn’t generate a reply—try sending a shorter message.", modelName };
  }
  return { text, modelName };
}
