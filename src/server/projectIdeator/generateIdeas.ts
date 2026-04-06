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

/** Responses API text is not always on `output_text`; walk `output` when needed. */
function extractResponsesOutputText(res: unknown): string {
  const r = res as Record<string, unknown>;
  const direct = r.output_text;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const output = r.output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type === "message" && Array.isArray(o.content)) {
      for (const c of o.content) {
        if (!c || typeof c !== "object") continue;
        const cc = c as Record<string, unknown>;
        if (cc.type === "output_text" && typeof cc.text === "string") parts.push(cc.text);
      }
    }
  }
  return parts.join("\n").trim();
}

async function fetchIdeatorRawText(client: OpenAI, modelName: string, userPayload: string): Promise<string> {
  const sys = PROJECT_IDEATOR_SYSTEM_PROMPT;

  const chatJson = () =>
    client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userPayload },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 12000,
    });

  const chatPlain = () =>
    client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `${sys}\n\nRespond with a single JSON object only (no markdown fences).`,
        },
        { role: "user", content: userPayload },
      ],
      max_completion_tokens: 12000,
    });

  const responsesApi = () =>
    client.responses.create({
      model: modelName,
      input: [
        { role: "system", content: sys },
        { role: "user", content: userPayload },
      ],
      max_output_tokens: 12000,
      text: { verbosity: "low" },
    });

  let lastErr: unknown;

  try {
    const res = await chatJson();
    const t = res.choices[0]?.message?.content?.trim() ?? "";
    if (t) return t;
  } catch (e) {
    lastErr = e;
  }

  try {
    const res = await chatPlain();
    const t = res.choices[0]?.message?.content?.trim() ?? "";
    if (t) return t;
  } catch (e) {
    lastErr = e;
  }

  try {
    const res = await responsesApi();
    const t = extractResponsesOutputText(res);
    if (t) return t;
  } catch (e) {
    lastErr = e;
  }

  if (lastErr instanceof Error) throw lastErr;
  throw new Error(
    "Empty response from model. Check OPENAI_API_KEY, OPENAI_PROJECT_IDEATOR_MODEL, and account limits.",
  );
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

  const rawText = await fetchIdeatorRawText(client, modelName, userPayload);
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
