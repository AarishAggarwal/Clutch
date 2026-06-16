import OpenAI from "openai";
import type { EssayType } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { modelEvaluationJsonSchema } from "@/lib/evaluationSchema";
import { buildEssayEvaluationPrompts } from "@/lib/promptTemplates";
import { getAcceptedEssaysReferenceText } from "@/server/acceptedEssaysReference";
import { sanitizeJsonStrings } from "@/server/plainText";

function extractJsonObject(text: string): string {
  const cleaned = text
    .trim()
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response.");
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

export async function evaluateEssayWithOpenAI(params: {
  essayType: EssayType;
  essayText: string;
  supplementalContext?: {
    universityName: string;
    promptQuestion: string;
    cycleYear: string;
  };
  activitiesContext?: string;
}): Promise<{
  provider: "groq";
  modelName: string;
  rawJson: unknown;
  parsedJson: ModelEvaluationJson;
}> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const modelName = process.env.GROQ_ESSAY_MODEL ?? "openai/gpt-oss-20b";

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
  });
  const referenceCorpus = getAcceptedEssaysReferenceText();
  const { system, user } = buildEssayEvaluationPrompts({
    essayType: params.essayType,
    essayText: params.essayText,
    supplementalContext: params.supplementalContext,
    activitiesContext: params.activitiesContext,
    referenceCorpus,
  });

  const response = await withTimeout(
    client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2800,
      temperature: 0,
    }),
    30000,
    "Groq evaluation",
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content.");

  const parsed = parseModelJson(content);

  const parsedJson = modelEvaluationJsonSchema.parse(sanitizeJsonStrings(parsed));

  return {
    provider: "groq",
    modelName,
    rawJson: content,
    parsedJson,
  };
}

