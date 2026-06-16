export function sanitizePlainText(input: string): string {
  return input
    .replace(/[*|`#]/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeJsonStrings<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizePlainText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeJsonStrings(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeJsonStrings(v);
    }
    return out as T;
  }
  return value;
}
