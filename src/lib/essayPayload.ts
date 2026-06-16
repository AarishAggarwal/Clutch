import { countCharacters, countWords, stripHtml } from "@/lib/essayLimits";
import type { essayInputSchema } from "@/lib/workspaceSchemas";
import type { z } from "zod";

type EssayPayload = z.infer<typeof essayInputSchema>;

export function normalizeEssayPayload(payload: EssayPayload) {
  const plainText = (payload.plainText ?? stripHtml(payload.richContent ?? "") ?? payload.content ?? "").trim();
  const content = payload.content?.trim() || plainText;
  const wordCount = countWords(plainText || content);
  const characterCount = countCharacters(plainText || content);
  return {
    ...payload,
    content,
    plainText: plainText || content,
    wordCount,
    characterCount,
  };
}
