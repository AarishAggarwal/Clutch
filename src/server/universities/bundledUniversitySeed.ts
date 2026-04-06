import type { Prisma } from "@prisma/client";
import bundled from "@/data/universities.seed.json";
import { prisma } from "@/server/prisma";
import { resolveUniversityLogo } from "@/server/universities/logoResolver";

type BundledRow = Omit<
  Prisma.UniversityCreateInput,
  "id" | "createdAt" | "updatedAt" | "logoUrl" | "logoSource" | "lastVerifiedAt"
> & {
  lastVerifiedAt?: string | null;
};

/**
 * Inserts/updates the curated catalog from `src/data/universities.seed.json`.
 * Used on Vercel (and anywhere the large College Scorecard CSV folder is absent).
 * Values are a static snapshot; local CSV ingest still overrides when present.
 */
export async function seedBundledUniversitiesFromJson(): Promise<{ upserted: number }> {
  const rows = bundled as BundledRow[];
  let upserted = 0;
  for (const row of rows) {
    const logo = resolveUniversityLogo({ website: row.website ?? null, name: row.name });
    const lastVerifiedAt = row.lastVerifiedAt ? new Date(row.lastVerifiedAt) : new Date();
    const { lastVerifiedAt: _lv, ...rest } = row;
    await prisma.university.upsert({
      where: { slug: row.slug },
      create: {
        ...rest,
        logoUrl: logo.logoUrl,
        logoSource: logo.logoSource,
        lastVerifiedAt,
      },
      update: {
        ...rest,
        logoUrl: logo.logoUrl,
        logoSource: logo.logoSource,
        lastVerifiedAt,
      },
    });
    upserted += 1;
  }
  return { upserted };
}
