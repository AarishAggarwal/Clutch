import fs from "fs";
import path from "path";

/** Soft cap to stay within model context when the corpus grows. */
const MAX_CORPUS_CHARS = 100_000;

const DEFAULT_RELATIVE = ["src", "data", "accepted-essays-corpus.txt"];

/**
 * Plain-text corpus extracted from admitted-student essays (see scripts/extract-accepted-essays-pdf.mjs).
 * Returns undefined if the file is missing or empty so evaluation still works without it.
 */
export function getAcceptedEssaysReferenceText(): string | undefined {
  const override = process.env.ACCEPTED_ESSAYS_CORPUS_PATH?.trim();
  const filePath = override && override.length > 0
    ? path.isAbsolute(override)
      ? override
      : path.join(process.cwd(), override)
    : path.join(process.cwd(), ...DEFAULT_RELATIVE);

  try {
    if (!fs.existsSync(filePath)) return undefined;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return undefined;
    if (raw.length <= MAX_CORPUS_CHARS) return raw;
    return (
      raw.slice(0, MAX_CORPUS_CHARS) +
      "\n\n[Reference corpus truncated for length; regenerate or split the file if needed.]"
    );
  } catch {
    return undefined;
  }
}
