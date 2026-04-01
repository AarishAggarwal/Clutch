import type { SupplementalPrompt, SupplementalUniversity } from "@/lib/types";
import { supplementalSchoolsA } from "@/lib/supplemental/schools-a";
import { supplementalSchoolsB } from "@/lib/supplemental/schools-b";
import { supplementalSchoolsC, universityOfCaliforniaPiQs } from "@/lib/supplemental/schools-c";

function byName(a: SupplementalUniversity, b: SupplementalUniversity) {
  return a.name.localeCompare(b.name);
}

const merged: SupplementalUniversity[] = [
  ...supplementalSchoolsA,
  ...supplementalSchoolsB,
  ...supplementalSchoolsC,
].sort(byName);

const supplementalBySlug = new Map<string, SupplementalUniversity>(
  merged.map((u) => [u.slug, u]),
);

const ucSlugPattern = /^university-of-california-/;

/** Full list for chat and pickers — IDs match College Scorecard-style `slug` values. */
export const supplementalUniversities: SupplementalUniversity[] = merged;

/**
 * Catalog row for a database slug, including UC campuses (shared PIQ set).
 */
export function getSupplementalCatalogEntryForSlug(slug: string): SupplementalUniversity | undefined {
  const direct = supplementalBySlug.get(slug);
  if (direct) return direct;
  if (ucSlugPattern.test(slug)) {
    return {
      ...universityOfCaliforniaPiQs,
      id: slug,
      slug,
      name: universityOfCaliforniaPiQs.name,
    };
  }
  return undefined;
}

export function getSupplementalPromptsForSlug(slug: string): SupplementalPrompt[] {
  return getSupplementalCatalogEntryForSlug(slug)?.prompts ?? [];
}
