import type OpenAI from "openai";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

/**
 * Normalizes OpenAI Responses API payloads and Chat Completions message content
 * so callers are not tied to `output_text` or string-only `message.content`.
 */
export function extractResponsesOutputText(res: unknown): string {
  const r = res as Record<string, unknown>;
  const direct = r.output_text;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const output = r.output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type === "message") {
      const content = o.content;
      if (typeof content === "string" && content.trim()) {
        parts.push(content.trim());
        continue;
      }
      if (Array.isArray(content)) {
        for (const c of content) {
          if (!c || typeof c !== "object") continue;
          const cc = c as Record<string, unknown>;
          if (cc.type === "output_text" && typeof cc.text === "string") parts.push(cc.text);
          else if (typeof cc.text === "string") parts.push(cc.text);
        }
      }
    }
  }
  return parts.join("\n").trim();
}

export function chatCompletionMessageText(message: { content?: unknown } | null | undefined): string {
  const c = message?.content;
  if (c == null) return "";
  if (typeof c === "string") return c.trim();
  if (Array.isArray(c)) {
    const parts: string[] = [];
    for (const part of c) {
      if (!part || typeof part !== "object") continue;
      const p = part as Record<string, unknown>;
      if (typeof p.text === "string") parts.push(p.text);
    }
    return parts.join("").trim();
  }
  return "";
}

function isUnsupportedParamError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /max_completion_tokens|Unsupported parameter|Unrecognized request argument/i.test(msg);
}

/** Prefer max_completion_tokens; retry with max_tokens when the model/API rejects it. */
export async function chatCompletionCreateFlexible(
  client: OpenAI,
  args: ChatCompletionCreateParamsNonStreaming,
): Promise<ChatCompletion> {
  try {
    return await client.chat.completions.create(args);
  } catch (e) {
    if (!isUnsupportedParamError(e)) throw e;
    const { max_completion_tokens: mct, ...rest } = args as ChatCompletionCreateParamsNonStreaming & {
      max_completion_tokens?: number;
    };
    return await client.chat.completions.create({
      ...rest,
      max_tokens: typeof mct === "number" && mct > 0 ? Math.min(mct, 16384) : 4096,
    });
  }
}
