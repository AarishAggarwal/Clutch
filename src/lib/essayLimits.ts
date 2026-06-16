export type LimitType = "word" | "character";

export type ParsedLimit = {
  limitType: LimitType;
  limitValue: number;
} | null;

export function parseLimitFromPrompt(prompt: string): ParsedLimit {
  const text = prompt.trim();
  if (!text) return null;

  const wordMatch =
    text.match(/(\d{2,4})\s*words?\b/i) ||
    text.match(/\b(?:max(?:imum)?|up to|limit(?:ed)? to|within)\s*(\d{2,4})\s*words?\b/i) ||
    text.match(/\b(\d{2,4})-word\b/i);
  if (wordMatch) {
    const n = Number(wordMatch[1]);
    if (n > 0 && n <= 5000) return { limitType: "word", limitValue: n };
  }

  const charMatch =
    text.match(/(\d{2,4})\s*characters?\b/i) ||
    text.match(/\b(?:max(?:imum)?|up to|limit(?:ed)? to|within)\s*(\d{2,4})\s*characters?\b/i);
  if (charMatch) {
    const n = Number(charMatch[1]);
    if (n > 0 && n <= 10000) return { limitType: "character", limitValue: n };
  }

  return null;
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function limitStatus(params: {
  limitType?: LimitType | null;
  limitValue?: number | null;
  wordCount: number;
  characterCount: number;
}) {
  const { limitType, limitValue, wordCount, characterCount } = params;
  if (!limitType || !limitValue) {
    return { current: wordCount, max: null as number | null, remaining: null as number | null, exceeded: false, unit: "words" as const };
  }
  const current = limitType === "character" ? characterCount : wordCount;
  const remaining = limitValue - current;
  return {
    current,
    max: limitValue,
    remaining,
    exceeded: current > limitValue,
    unit: limitType === "character" ? ("characters" as const) : ("words" as const),
  };
}
