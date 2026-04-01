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
  // College Scorecard locale groups (simplified for UX clarity).
  if ([11, 12, 13].includes(n)) return "City";
  if ([21, 22, 23].includes(n)) return "Suburban";
  if ([31, 32, 33].includes(n)) return "Town";
  if ([41, 42, 43].includes(n)) return "Rural";
  return "Not available";
}

export function normalizeScorecardSchool(raw: any, target: { name: string; website: string }) {
  const website = raw.school?.school_url ? `https://${String(raw.school.school_url).replace(/^https?:\/\//, "")}` : target.website;
  const logo = resolveUniversityLogo({ explicitLogoUrl: null, website, name: raw.school?.name ?? target.name });

  return {
    externalId: raw.id ? String(raw.id) : null,
    name: String(raw.school?.name ?? target.name),
    slug: slugify(String(raw.school?.name ?? target.name)),
    city: raw.school?.city ?? null,
    state: raw.school?.state ?? null,
    control:
      raw.school?.ownership === 1 ? "Public" : raw.school?.ownership === 2 ? "Private Nonprofit" : raw.school?.ownership === 3 ? "Private For-Profit" : null,
    level: raw.school?.degrees_awarded?.predominant === 3 ? "4-year" : null,
    website,
    logoUrl: logo.logoUrl,
    logoSource: logo.logoSource,
    address: raw.school?.address ?? null,
    phone: raw.school?.phone ?? null,
    applicationFee: raw.latest?.admissions?.application_fee?.overall ?? null,
    tuitionInState: raw.latest?.cost?.tuition?.in_state ?? null,
    tuitionOutOfState: raw.latest?.cost?.tuition?.out_of_state ?? null,
    averageAnnualCost: raw.latest?.cost?.avg_net_price?.overall ?? null,
    housingAvailable: raw.latest?.student?.housing_pct != null ? Number(raw.latest.student.housing_pct) > 0 : null,
    housingCost: null,
    campusSetting: localeToSetting(raw.school?.locale),
    acceptanceRate: raw.latest?.admissions?.admission_rate?.overall ?? null,
    graduationRate: raw.latest?.completion?.rate_4yr_150nt ?? null,
    medianEarnings: raw.latest?.earnings?.["10_yrs_after_entry"]?.median ?? null,
    undergradEnrollment: raw.latest?.student?.size ?? null,
    totalEnrollment: raw.latest?.student?.size ?? null,
    satReading25: raw.latest?.admissions?.sat_scores?.["25th_percentile"]?.critical_reading ?? null,
    satReading75: raw.latest?.admissions?.sat_scores?.["75th_percentile"]?.critical_reading ?? null,
    satMath25: raw.latest?.admissions?.sat_scores?.["25th_percentile"]?.math ?? null,
    satMath75: raw.latest?.admissions?.sat_scores?.["75th_percentile"]?.math ?? null,
    act25: raw.latest?.admissions?.act_scores?.["25th_percentile"]?.cumulative ?? null,
    act75: raw.latest?.admissions?.act_scores?.["75th_percentile"]?.cumulative ?? null,
    testingPolicy: null,
    admissionsDeadlineED: null,
    admissionsDeadlineEA: null,
    admissionsDeadlineRD: null,
    popularMajors: JSON.stringify(raw.latest?.academics?.program_percentage ?? {}),
    notes: null,
    sourceName: "U.S. Department of Education College Scorecard",
    sourceUrl: "https://collegescorecard.ed.gov/data/api/",
    rawSourcePayload: JSON.stringify(raw),
    lastVerifiedAt: new Date(),
  };
}
