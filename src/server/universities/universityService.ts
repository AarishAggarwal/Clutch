import { prisma } from "@/server/prisma";
import type { DiscoveryFilters, UniversityRecord } from "@/lib/universityTypes";
import { ingestFromLocalScorecardCsv } from "@/server/universities/localScorecardIngestion";

export async function syncUniversitiesFromSources() {
  const report = {
    totalTargets: 0,
    refreshed: 0,
    notFound: 0,
    failed: 0,
    failures: [] as Array<{ target: string; error: string }>,
    loadedUniversities: [] as string[],
  };
  try {
    const local = await ingestFromLocalScorecardCsv();
    report.totalTargets = local.loaded.length;
    report.notFound = local.notFoundTargets.length;
    report.loadedUniversities = local.loadedNames;
    for (const uni of local.loaded) {
      await prisma.university.upsert({
        where: { slug: uni.slug },
        update: uni,
        create: uni,
      });
      report.refreshed += 1;
    }
  } catch (err) {
    report.failed += 1;
    report.failures.push({ target: "Local CSV ingestion", error: String((err as any)?.message ?? err) });
  }
  return report;
}

export async function forceRefreshUniversitiesFromSources() {
  const report = await syncUniversitiesFromSources();
  return { ...report, usingLocalScorecardFolder: true };
}

function parseMajors(popularMajors: string | null): string[] {
  if (!popularMajors) return [];
  try {
    const parsed = JSON.parse(popularMajors) as Record<string, number>;
    return Object.entries(parsed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key.replaceAll("_", " "));
  } catch {
    return [];
  }
}

function computeDataQuality(row: {
  acceptanceRate: number | null;
  graduationRate: number | null;
  averageAnnualCost: number | null;
  tuitionOutOfState: number | null;
  undergradEnrollment: number | null;
  website: string | null;
  city: string | null;
  state: string | null;
  control: string | null;
  lastVerifiedAt: Date | null;
}) {
  const critical: Array<[string, unknown]> = [
    ["acceptanceRate", row.acceptanceRate],
    ["graduationRate", row.graduationRate],
    ["averageAnnualCost", row.averageAnnualCost],
    ["tuitionOutOfState", row.tuitionOutOfState],
    ["undergradEnrollment", row.undergradEnrollment],
    ["website", row.website],
    ["city", row.city],
    ["state", row.state],
    ["control", row.control],
  ];
  const missingCriticalFields = critical.filter(([, v]) => v == null || v === "").map(([k]) => k);
  const coveragePct = Math.round(((critical.length - missingCriticalFields.length) / critical.length) * 100);
  const freshnessDays =
    row.lastVerifiedAt != null
      ? Math.floor((Date.now() - row.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  return { coveragePct, freshnessDays, missingCriticalFields };
}

export function mapUniversityRow(row: any): UniversityRecord {
  const dataQuality = computeDataQuality({
    acceptanceRate: row.acceptanceRate,
    graduationRate: row.graduationRate,
    averageAnnualCost: row.averageAnnualCost,
    tuitionOutOfState: row.tuitionOutOfState,
    undergradEnrollment: row.undergradEnrollment,
    website: row.website,
    city: row.city,
    state: row.state,
    control: row.control,
    lastVerifiedAt: row.lastVerifiedAt,
  });
  return {
    id: row.id,
    externalId: row.externalId,
    name: row.name,
    slug: row.slug,
    city: row.city,
    state: row.state,
    control: row.control,
    level: row.level,
    website: row.website,
    logoUrl: row.logoUrl,
    logoSource: row.logoSource,
    address: row.address,
    phone: row.phone,
    applicationFee: row.applicationFee,
    tuitionInState: row.tuitionInState,
    tuitionOutOfState: row.tuitionOutOfState,
    averageAnnualCost: row.averageAnnualCost,
    housingAvailable: row.housingAvailable,
    housingCost: row.housingCost,
    campusSetting: row.campusSetting,
    acceptanceRate: row.acceptanceRate,
    graduationRate: row.graduationRate,
    medianEarnings: row.medianEarnings,
    undergradEnrollment: row.undergradEnrollment,
    totalEnrollment: row.totalEnrollment,
    satReading25: row.satReading25,
    satReading75: row.satReading75,
    satMath25: row.satMath25,
    satMath75: row.satMath75,
    act25: row.act25,
    act75: row.act75,
    testingPolicy: row.testingPolicy,
    admissionsDeadlineED: row.admissionsDeadlineED,
    admissionsDeadlineEA: row.admissionsDeadlineEA,
    admissionsDeadlineRD: row.admissionsDeadlineRD,
    popularMajors: parseMajors(row.popularMajors),
    notes: row.notes,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    sourceCoreName: row.sourceCoreName,
    sourceAdmissionsName: row.sourceAdmissionsName,
    sourceBrandName: row.sourceBrandName,
    sourceCoreUrl: row.sourceCoreUrl,
    sourceAdmissionsUrl: row.sourceAdmissionsUrl,
    sourceBrandUrl: row.sourceBrandUrl,
    rawSourcePayload: row.rawSourcePayload,
    lastVerifiedAt: row.lastVerifiedAt ? row.lastVerifiedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    dataQuality,
  };
}

export async function ensureUniversityCache() {
  const count = await prisma.university.count();
  if (count < 8) {
    await syncUniversitiesFromSources();
  }
}

export async function getUniversities(filters: DiscoveryFilters) {
  await ensureUniversityCache();
  const rows = await prisma.university.findMany();
  let list = rows.map(mapUniversityRow);

  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || `${u.city ?? ""} ${u.state ?? ""}`.toLowerCase().includes(q));
  }
  if (filters.state) list = list.filter((u) => u.state === filters.state);
  if (filters.control) list = list.filter((u) => (u.control ?? "").toLowerCase().includes(filters.control!.toLowerCase()));
  if (filters.costMax != null) list = list.filter((u) => u.averageAnnualCost != null && u.averageAnnualCost <= filters.costMax!);
  if (filters.acceptanceMax != null)
    list = list.filter((u) => u.acceptanceRate != null && u.acceptanceRate <= filters.acceptanceMax! / 100);
  if (filters.housingOnly) list = list.filter((u) => u.housingAvailable === true);

  switch (filters.sort) {
    case "lowest_cost":
      list.sort((a, b) => (a.averageAnnualCost ?? Number.MAX_SAFE_INTEGER) - (b.averageAnnualCost ?? Number.MAX_SAFE_INTEGER));
      break;
    case "highest_selectivity":
      list.sort((a, b) => (a.acceptanceRate ?? 1) - (b.acceptanceRate ?? 1));
      break;
    case "highest_graduation":
      list.sort((a, b) => (b.graduationRate ?? 0) - (a.graduationRate ?? 0));
      break;
    default:
      list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
}

export async function getUniversityBySlug(slug: string) {
  await ensureUniversityCache();
  const row = await prisma.university.findUnique({ where: { slug } });
  return row ? mapUniversityRow(row) : null;
}

/** Lightweight suggestions for the profile sidebar (deterministic-ish variety). */
export async function getSuggestedUniversities(slug: string, limit = 3): Promise<UniversityRecord[]> {
  await ensureUniversityCache();
  const current = await prisma.university.findUnique({ where: { slug }, select: { state: true } });
  const sameState =
    current?.state != null
      ? await prisma.university.findMany({
          where: { slug: { not: slug }, state: current.state },
          take: limit + 2,
        })
      : [];
  const rest =
    sameState.length < limit
      ? await prisma.university.findMany({
          where: { slug: { not: slug } },
          take: 24,
        })
      : [];
  const merged = [...sameState, ...rest]
    .filter((r, i, a) => a.findIndex((x) => x.slug === r.slug) === i)
    .slice(0, limit);
  return merged.map(mapUniversityRow);
}
