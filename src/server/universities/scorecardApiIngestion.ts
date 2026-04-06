import { prisma } from "@/server/prisma";
import { normalizeScorecardApiRecord, unflattenCollegeScorecardRow } from "@/server/universities/universityNormalizer";

const SCORECARD_API = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

/** Fields required by `normalizeScorecardApiRecord` (comma-separated for the API). */
const SCORECARD_FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.zip",
  "school.school_url",
  "school.ownership",
  "school.locale",
  "school.degrees_awarded.predominant",
  "school.main_campus",
  "school.address",
  "school.phone",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.application_fee.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.avg_net_price.overall",
  "latest.student.housing_pct",
  "latest.student.size",
  "latest.completion.rate_4yr_150nt",
  "latest.academics.program_percentage",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.earnings.median",
].join(",");

function isMainCampusPredominantlyFourYear(raw: any): boolean {
  const main = raw.school?.main_campus;
  const pred = raw.school?.degrees_awarded?.predominant;
  const mainOk = main === true || main === 1;
  return Boolean(mainOk && pred === 3);
}

type IngestOptions = {
  /** Stop after this many schools (for debugging). */
  maxSchools?: number;
  /** Delay ms between HTTP pages (be polite to api.data.gov). */
  pageDelayMs?: number;
};

async function apiSupportsMainFourYearFilter(apiKey: string): Promise<boolean> {
  const probeUrl = new URL(SCORECARD_API);
  probeUrl.searchParams.set("api_key", apiKey.trim());
  probeUrl.searchParams.set("fields", "id");
  probeUrl.searchParams.set("_per_page", "1");
  probeUrl.searchParams.set("_page", "0");
  probeUrl.searchParams.set("school.degrees_awarded.predominant", "3");
  probeUrl.searchParams.set("school.main_campus", "1");
  const pr = await fetch(probeUrl.toString(), { cache: "no-store" });
  return pr.ok;
}

/**
 * Pulls all matching institutions from the College Scorecard API (paginated), keeps only
 * main-campus schools whose predominant degree is bachelor’s (4-year), and upserts into `University`.
 *
 * Run via `npm run db:sync-universities-api` with `COLLEGE_SCORECARD_API_KEY` and `DATABASE_URL` set.
 * Do not call from Vercel serverless routes — full sync can take several minutes.
 */
export async function ingestAllSchoolsFromScorecardApi(
  apiKey: string,
  options: IngestOptions = {},
): Promise<{ upserted: number; pages: number; filteredOut: number; usedServerFilters: boolean }> {
  const maxSchools = options.maxSchools ?? Number.POSITIVE_INFINITY;
  const pageDelayMs = options.pageDelayMs ?? 120;
  const useServerFilters = await apiSupportsMainFourYearFilter(apiKey);

  let upserted = 0;
  let pages = 0;
  let filteredOut = 0;
  let page = 0;

  while (upserted < maxSchools) {
    const url = new URL(SCORECARD_API);
    url.searchParams.set("api_key", apiKey.trim());
    url.searchParams.set("fields", SCORECARD_FIELDS);
    url.searchParams.set("_page", String(page));
    url.searchParams.set("_per_page", "100");
    if (useServerFilters) {
      url.searchParams.set("school.degrees_awarded.predominant", "3");
      url.searchParams.set("school.main_campus", "1");
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`College Scorecard API error ${res.status}: ${text.slice(0, 500)}`);
    }

    let json: { metadata?: { total?: number; per_page?: number; page?: number }; results?: any[] };
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      throw new Error("College Scorecard API returned non-JSON.");
    }

    const results = json.results ?? [];
    pages += 1;

    if (!results.length) break;

    for (const raw of results) {
      const row = unflattenCollegeScorecardRow(raw as Record<string, unknown>);
      if (!useServerFilters && !isMainCampusPredominantlyFourYear(row)) {
        filteredOut += 1;
        continue;
      }
      if (!row.school?.name || row.id == null) continue;

      const data = normalizeScorecardApiRecord(row);
      await prisma.university.upsert({
        where: { slug: data.slug },
        create: data,
        update: data,
      });
      upserted += 1;
      if (upserted >= maxSchools) break;
    }

    const meta = json.metadata;
    const total = meta?.total ?? 0;
    const perPage = meta?.per_page ?? 100;
    if (total > 0 && (page + 1) * perPage >= total) break;
    if (results.length < 100) break;

    page += 1;
    await new Promise((r) => setTimeout(r, pageDelayMs));
  }

  return { upserted, pages, filteredOut, usedServerFilters: useServerFilters };
}
