import OpenAI from "openai";
import { PROJECT_IDEATOR_SYSTEM_PROMPT } from "@/lib/projectIdeator/systemPrompt";
import { buildIdeatorUserPayload, type ComposerMessage } from "@/lib/projectIdeator/promptComposer";
import { ideatorResponseSchema, type IdeaFilters, type IdeaModeId, type IntakeProfile, type IdeatorResponse } from "@/lib/projectIdeator/types";
import {
  chatCompletionCreateFlexible,
  chatCompletionMessageText,
  extractResponsesOutputText,
} from "@/server/openaiResponseText";

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

async function fetchIdeatorRawText(client: OpenAI, modelName: string, userPayload: string): Promise<string> {
  const sys = PROJECT_IDEATOR_SYSTEM_PROMPT;

  const chatJson = () =>
    chatCompletionCreateFlexible(client, {
      model: modelName,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userPayload },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 12000,
    });

  const chatPlain = () =>
    chatCompletionCreateFlexible(client, {
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
      text: { verbosity: "medium" },
    });

  let lastErr: unknown;

  try {
    const res = await chatJson();
    const t = chatCompletionMessageText(res.choices[0]?.message);
    if (t) return t;
  } catch (e) {
    lastErr = e;
  }

  try {
    const res = await chatPlain();
    const t = chatCompletionMessageText(res.choices[0]?.message);
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
    "Empty response from model. Check GROQ_API_KEY/GEMINI_API_KEY, chosen model vars, and account limits.",
  );
}

async function fetchIdeatorRawTextGemini(modelName: string, userPayload: string, apiKey: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: `${PROJECT_IDEATOR_SYSTEM_PROMPT}\n\nReturn exactly one valid JSON object. No markdown.` }],
      },
      contents: [{ role: "user", parts: [{ text: userPayload }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 12000,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ideator HTTP ${res.status}`);
  const json: any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini ideator returned empty text.");
  return text;
}

export async function generateProjectIdeas(params: {
  profile: IntakeProfile;
  mode: IdeaModeId;
  filters: IdeaFilters;
  ideaCount: number;
  messages: ComposerMessage[];
  userMessage: string;
}): Promise<{ response: IdeatorResponse; modelName: string; rawText: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqModel = process.env.GROQ_PROJECT_IDEATOR_MODEL ?? "openai/gpt-oss-20b";
  const geminiModel = process.env.GEMINI_PROJECT_IDEATOR_MODEL ?? "gemini-2.0-flash";

  const userPayload = buildIdeatorUserPayload({
    ...params,
    ideaCount: Math.min(7, Math.max(1, params.ideaCount)),
  });

  if (!groqKey?.trim() && !geminiKey?.trim()) {
    throw new Error("Missing model keys. Set GROQ_API_KEY and/or GEMINI_API_KEY.");
  }
  let rawText = "";
  let modelName = groqModel;
  if (groqKey?.trim()) {
    const client = new OpenAI({
      apiKey: groqKey,
      baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
    });
    try {
      rawText = await fetchIdeatorRawText(client, groqModel, userPayload);
      modelName = groqModel;
    } catch {
      rawText = "";
    }
  }
  if (!rawText && geminiKey?.trim()) {
    rawText = await fetchIdeatorRawTextGemini(geminiModel, userPayload, geminiKey);
    modelName = geminiModel;
  }
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
