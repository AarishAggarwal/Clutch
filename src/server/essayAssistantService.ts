import OpenAI from "openai";
import { prisma } from "@/server/prisma";
import { sanitizePlainText } from "@/server/plainText";
import { limitStatus } from "@/lib/essayLimits";

const SYSTEM = `You are an expert college essay writing assistant.
Help with brainstorming, grammar, tone, structure, shortening, expanding, and college-specific feedback.
Use plain professional text only. No markdown, asterisks, pipes, or decorative symbols.
Use only the essay context provided. If context is missing, say what is not completed yet.
Be specific and actionable.`;

export async function getEssayAssistantReply(params: {
  userId: string;
  userMessage: string;
  essayId?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ reply: string; modelName: string }> {
  let essayContext = "No essay selected.";
  if (params.essayId) {
    const essay = await prisma.essay.findFirst({
      where: { id: params.essayId, userId: params.userId },
    });
    if (essay) {
      const limit = limitStatus({
        limitType: essay.limitType as "word" | "character" | null,
        limitValue: essay.limitValue,
        wordCount: essay.wordCount,
        characterCount: essay.characterCount,
      });
      essayContext = [
        `Title: ${essay.title}`,
        `Type: ${essay.essayType}`,
        `University: ${essay.universityName ?? "N/A"}`,
        `Prompt: ${essay.promptText ?? "N/A"}`,
        `Limit: ${limit.max ? `${limit.current}/${limit.max} ${limit.unit}` : "not set"}`,
        `Status: ${essay.status}`,
        "",
        "Essay text:",
        essay.plainText || essay.content,
      ].join("\n");
    }
  }

  const payload = [
    "ESSAY CONTEXT:",
    essayContext,
    "",
    "RECENT CHAT:",
    ...(params.history.length
      ? params.history.slice(-12).map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      : ["(none)"]),
    "",
    "USER:",
    params.userMessage,
  ].join("\n");

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqModel = process.env.GROQ_ESSAY_ASSISTANT_MODEL ?? "openai/gpt-oss-20b";
  const geminiModel = process.env.GEMINI_ESSAY_ASSISTANT_MODEL ?? "gemini-2.0-flash-lite";

  if (groqKey?.trim()) {
    try {
      const client = new OpenAI({
        apiKey: groqKey,
        baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
      });
      const res = await client.chat.completions.create({
        model: groqModel,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: payload },
        ],
        max_tokens: 1800,
        temperature: 0.4,
      });
      const reply = res.choices[0]?.message?.content?.trim();
      if (reply) return { reply: sanitizePlainText(reply), modelName: groqModel };
    } catch {
      // fallback
    }
  }

  if (geminiKey?.trim()) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: payload }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1800 },
        }),
      },
    );
    if (res.ok) {
      const json: any = await res.json();
      const reply = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
      if (reply) return { reply: sanitizePlainText(reply), modelName: geminiModel };
    }
  }

  return {
    reply: sanitizePlainText(
      "I can help once your essay context is available. Open an essay in the workspace, then ask me to improve a paragraph or adjust tone.",
    ),
    modelName: "fallback-local",
  };
}
