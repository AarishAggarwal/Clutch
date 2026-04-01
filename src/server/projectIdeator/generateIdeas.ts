import OpenAI from "openai";
import { PROJECT_IDEATOR_SYSTEM_PROMPT } from "@/lib/projectIdeator/systemPrompt";
import { buildIdeatorUserPayload, type ComposerMessage } from "@/lib/projectIdeator/promptComposer";
import { ideatorResponseSchema, type IdeaFilters, type IdeaModeId, type IntakeProfile, type IdeatorResponse } from "@/lib/projectIdeator/types";

function extractJsonObject(text: string): string {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const inner = fence ? fence[1]!.trim() : t;
  const first = inner.indexOf("{");
  const last = inner.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object in model output.");
  return inner.slice(first, last + 1);
}

function coerceIdeatorResponse(raw: unknown): IdeatorResponse {
  const parsed = ideatorResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid ideator JSON: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function generateProjectIdeas(params: {
  profile: IntakeProfile;
  mode: IdeaModeId;
  filters: IdeaFilters;
  ideaCount: number;
  messages: ComposerMessage[];
  userMessage: string;
}): Promise<{ response: IdeatorResponse; modelName: string; rawText: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_PROJECT_IDEATOR_MODEL ?? process.env.OPENAI_EVAL_MODEL ?? "gpt-4o";

  const userPayload = buildIdeatorUserPayload({
    ...params,
    ideaCount: Math.min(7, Math.max(1, params.ideaCount)),
  });

  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local to use the Project Ideator.");
  }

  const client = new OpenAI({ apiKey });

  const res = await client.responses.create({
    model: modelName,
    input: [
      { role: "system", content: PROJECT_IDEATOR_SYSTEM_PROMPT },
      { role: "user", content: userPayload },
    ],
    max_output_tokens: 12000,
    text: {
      verbosity: "low",
    },
  });

  const rawText = ((res as any).output_text as string | undefined)?.trim() ?? "";
  if (!rawText) {
    throw new Error("Empty response from model.");
  }

  let json: unknown;
  try {
    json = JSON.parse(extractJsonObject(rawText));
  } catch {
    json = JSON.parse(rawText);
  }

  const response = coerceIdeatorResponse(json);
  return { response, modelName, rawText };
}
