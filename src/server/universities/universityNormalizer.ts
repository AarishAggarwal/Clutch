import type { Prisma } from "@prisma/client";
import { resolveUniversityLogo } from "@/server/universities/logoResolver";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function localeToSetting(locale: unknown): string | null {
  if (locale == null) return null;
  const n = Number(locale);
  if ([11, 12, 13].includes(n)) return "City";
  if ([21, 22, 23].includes(n)) return "Suburban";
  if ([31, 32, 33].includes(n)) return "Town";
  if ([41, 42, 43].includes(n)) return "Rural";
  return "Not available";
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function popularMajorsFromRaw(raw: any): string | null {
  const pp = raw.latest?.academics?.program_percentage;
  if (!pp || typeof pp !== "object") return null;
  try {
    const s = JSON.stringify(pp);
    return s === "{}" ? null : s;
  } catch {
    return null;
  }
}

/**
 * Maps a College Scorecard API `schools` result object to Prisma fields.
 * Uses the same field paths as https://api.data.gov/ed/collegescorecard/v1/schools
 */
export function normalizeScorecardApiRecord(raw: any): Prisma.UniversityCreateInput {
  const name = String(raw.school?.name ?? "Unknown");
  const website = raw.school?.school_url
    ? `https://${String(raw.school.school_url).replace(/^https?:\/\//, "")}`
    : null;
  const logo = resolveUniversityLogo({ explicitLogoUrl: null, website, name });

  const medianEarnings =
    numOrNull(raw.latest?.earnings?.["10_yrs_after_entry"]?.median) ??
    numOrNull(raw.latest?.earnings?.median);

  return {
    externalId: raw.id != null ? String(raw.id) : null,
    name,
    slug: slugify(name),
    city: raw.school?.city ?? null,
    state: raw.school?.state ?? null,
    control:
      raw.school?.ownership === 1
        ? "Public"
        : raw.school?.ownership === 2
          ? "Private Nonprofit"
          : raw.school?.ownership === 3
            ? "Private For-Profit"
            : null,
    level: raw.school?.degrees_awarded?.predominant === 3 ? "4-year" : null,
    website,
    logoUrl: logo.logoUrl,
    logoSource: logo.logoSource,
    address: raw.school?.address ?? null,
    phone: raw.school?.phone != null ? String(raw.school.phone) : null,
    applicationFee: numOrNull(raw.latest?.admissions?.application_fee?.overall),
    tuitionInState: numOrNull(raw.latest?.cost?.tuition?.in_state),
    tuitionOutOfState: numOrNull(raw.latest?.cost?.tuition?.out_of_state),
    averageAnnualCost: numOrNull(raw.latest?.cost?.avg_net_price?.overall),
    housingAvailable:
      raw.latest?.student?.housing_pct != null ? Number(raw.latest.student.housing_pct) > 0 : null,
    housingCost: null,
    campusSetting: localeToSetting(raw.school?.locale),
    acceptanceRate: numOrNull(raw.latest?.admissions?.admission_rate?.overall),
    graduationRate: numOrNull(raw.latest?.completion?.rate_4yr_150nt),
    medianEarnings,
    undergradEnrollment: numOrNull(raw.latest?.student?.size),
    totalEnrollment: numOrNull(raw.latest?.student?.size),
    satReading25: numOrNull(raw.latest?.admissions?.sat_scores?.["25th_percentile"]?.critical_reading),
    satReading75: numOrNull(raw.latest?.admissions?.sat_scores?.["75th_percentile"]?.critical_reading),
    satMath25: numOrNull(raw.latest?.admissions?.sat_scores?.["25th_percentile"]?.math),
    satMath75: numOrNull(raw.latest?.admissions?.sat_scores?.["75th_percentile"]?.math),
    act25: numOrNull(raw.latest?.admissions?.act_scores?.["25th_percentile"]?.cumulative),
    act75: numOrNull(raw.latest?.admissions?.act_scores?.["75th_percentile"]?.cumulative),
    testingPolicy: null,
    admissionsDeadlineED: null,
    admissionsDeadlineEA: null,
    admissionsDeadlineRD: null,
    popularMajors: popularMajorsFromRaw(raw),
    notes: null,
    sourceName: "U.S. Department of Education College Scorecard",
    sourceUrl: "https://collegescorecard.ed.gov/data/api/",
    sourceCoreName: "College Scorecard API",
    sourceAdmissionsName: "Official university admissions websites",
    sourceBrandName: "Logo.dev + favicon fallback",
    sourceCoreUrl: "https://collegescorecard.ed.gov/data/",
    sourceAdmissionsUrl: null,
    sourceBrandUrl: website,
    rawSourcePayload: JSON.stringify(raw),
    lastVerifiedAt: new Date(),
  };
}

/** Narrow use: merge curated admissions URLs when ingesting a known target list. */
export function normalizeScorecardSchool(
  raw: any,
  target: { name: string; website: string; admissionsUrl?: string },
) {
  const base = normalizeScorecardApiRecord(raw);
  return {
    ...base,
    website: base.website ?? target.website,
    sourceAdmissionsUrl: target.admissionsUrl ?? base.sourceAdmissionsUrl,
  };
}
