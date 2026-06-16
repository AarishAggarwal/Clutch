import type { EssayType } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { modelEvaluationJsonSchema } from "@/lib/evaluationSchema";
import { buildEssayEvaluationPrompts } from "@/lib/promptTemplates";
import { getAcceptedEssaysReferenceText } from "@/server/acceptedEssaysReference";

function extractJsonObject(text: string): string {
  const cleaned = text
    .trim()
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in DeepSeek response.");
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function parseModelJson(text: string): unknown {
  const jsonText = extractJsonObject(text);
  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    // Some providers return an escaped JSON object as plain text.
    const unescaped = jsonText.replace(/\\"/g, '"').replace(/\\n/g, "\n");
    return JSON.parse(unescaped) as unknown;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function evaluateEssayWithClaude(params: {
  essayType: EssayType;
  essayText: string;
  supplementalContext?: {
    universityName: string;
    promptQuestion: string;
    cycleYear: string;
  };
  activitiesContext?: string;
}): Promise<{
  provider: "gemini";
  modelName: string;
  rawJson: unknown;
  parsedJson: ModelEvaluationJson;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const modelName = process.env.GEMINI_ESSAY_MODEL || "gemini-2.0-flash-lite";

  const referenceCorpus = getAcceptedEssaysReferenceText();
  const { system, user } = buildEssayEvaluationPrompts({
    essayType: params.essayType,
    essayText: params.essayText,
    supplementalContext: params.supplementalContext,
    activitiesContext: params.activitiesContext,
    referenceCorpus,
  });

  const res = await withTimeout(
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${system}\n\nReturn one valid JSON object only.` }],
        },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2800,
          responseMimeType: "application/json",
        },
      }),
    }),
    30000,
    "Gemini evaluation",
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${text}`);
  }

  const json: any = await res.json();
  const content = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
  if (!content || typeof content !== "string") {
    throw new Error("Gemini returned empty or non-string content.");
  }

  const parsed = parseModelJson(content);
  const parsedJson = modelEvaluationJsonSchema.parse(parsed);

  return {
    provider: "gemini",
    modelName,
    rawJson: content,
    parsedJson,
  };
}

