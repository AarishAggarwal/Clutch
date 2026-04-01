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

// NOTE: This file now talks to DeepSeek, not Claude.
// It uses the Anthropic env slot so you can just paste your DeepSeek key there.
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
  provider: "deepseek";
  modelName: string;
  rawJson: unknown;
  parsedJson: ModelEvaluationJson;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Missing DeepSeek API key (ANTHROPIC_API_KEY / DEEPSEEK_API_KEY).");

  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/v1";
  const modelName = process.env.ANTHROPIC_EVAL_MODEL || "deepseek-chat";

  const { system, user } = buildEssayEvaluationPrompts({
    essayType: params.essayType,
    essayText: params.essayText,
    supplementalContext: params.supplementalContext,
    activitiesContext: params.activitiesContext,
  });

  const body = {
    model: modelName,
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2800,
  };

  const res = await withTimeout(
    fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }),
    30000,
    "DeepSeek evaluation",
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek HTTP ${res.status}: ${text}`);
  }

  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("DeepSeek returned empty or non-string content.");
  }

  const parsed = parseModelJson(content);
  const parsedJson = modelEvaluationJsonSchema.parse(parsed);

  return {
    provider: "deepseek",
    modelName,
    rawJson: content,
    parsedJson,
  };
}

