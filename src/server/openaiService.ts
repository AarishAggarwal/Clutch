import OpenAI from "openai";
import type { EssayType } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import { modelEvaluationJsonSchema } from "@/lib/evaluationSchema";
import { buildEssayEvaluationPrompts } from "@/lib/promptTemplates";

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
  provider: "openai";
  modelName: string;
  rawJson: unknown;
  parsedJson: ModelEvaluationJson;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const modelName = process.env.OPENAI_EVAL_MODEL ?? "gpt-4o-mini";

  const client = new OpenAI({ apiKey });
  const { system, user } = buildEssayEvaluationPrompts({
    essayType: params.essayType,
    essayText: params.essayText,
    supplementalContext: params.supplementalContext,
    activitiesContext: params.activitiesContext,
  });

  const response = await withTimeout(
    client.responses.create({
      model: modelName,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_output_tokens: 2800,
      text: {
        verbosity: "low",
      },
    }),
    30000,
    "OpenAI evaluation",
  );

  const content = (response as any).output_text as string | undefined;
  if (!content) throw new Error("OpenAI returned empty content.");

  const parsed = parseModelJson(content);

  const parsedJson = modelEvaluationJsonSchema.parse(parsed);

  return {
    provider: "openai",
    modelName,
    rawJson: content,
    parsedJson,
  };
}

