export type ListBand = "dream" | "target" | "reach";

const SLUGS_KEY = "savedUniversities";
const BANDS_KEY = "universityShortlistBands";

export function loadShortlistSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SLUGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function loadShortlistBands(): Record<string, ListBand> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BANDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, ListBand> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === "dream" || v === "target" || v === "reach") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Ensure every slug in the list has a band (default target). */
export function bandsForSlugs(slugs: string[], bands: Record<string, ListBand>): Record<string, ListBand> {
  const next = { ...bands };
  for (const s of slugs) {
    if (!next[s]) next[s] = "target";
  }
  for (const k of Object.keys(next)) {
    if (!slugs.includes(k)) delete next[k];
  }
  return next;
}

export function persistShortlist(slugs: string[], bands: Record<string, ListBand>) {
  window.localStorage.setItem(SLUGS_KEY, JSON.stringify(slugs));
  window.localStorage.setItem(BANDS_KEY, JSON.stringify(bands));
  window.dispatchEvent(new Event("shortlist-updated"));
}
