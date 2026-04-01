import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { resolveUniversityLogo } from "@/server/universities/logoResolver";
import { universityIngestionTargets } from "@/server/universities/universityTargets";

type RawRow = Record<string, string>;

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function toNumber(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.trim();
  if (!s || s === "NULL" || s === "PrivacySuppressed" || s === "NA") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toBoolFromPct(v: string | undefined): boolean | null {
  const n = toNumber(v);
  if (n == null) return null;
  return n > 0;
}

function controlLabel(v: string | undefined): string | null {
  const n = toNumber(v);
  if (n === 1) return "Public";
  if (n === 2) return "Private Nonprofit";
  if (n === 3) return "Private For-Profit";
  return null;
}

function localeToSetting(v: string | undefined): string | null {
  const n = toNumber(v);
  if (n == null) return null;
  if ([11, 12, 13].includes(n)) return "City";
  if ([21, 22, 23].includes(n)) return "Suburban";
  if ([31, 32, 33].includes(n)) return "Town";
  if ([41, 42, 43].includes(n)) return "Rural";
  return null;
}

function mapAdmissionsOverridesByName() {
  const map = new Map<string, (typeof universityIngestionTargets)[number]>();
  for (const target of universityIngestionTargets) {
    map.set(normalizeName(target.name), target);
  }
  return map;
}

export async function ingestFromLocalScorecardCsv() {
  const csvPath = path.join(process.cwd(), "College_Scorecard_Raw_Data_03232026", "Most-Recent-Cohorts-Institution.csv");
  if (!fs.existsSync(csvPath)) throw new Error(`Local Scorecard file not found at ${csvPath}`);

  const byName = mapAdmissionsOverridesByName();
  const loadedByExternalId = new Map<string, any>();
  let headers: string[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!headers.length) {
      headers = parseCsvLine(line);
      continue;
    }
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const row: RawRow = {};
    for (let i = 0; i < headers.length; i += 1) row[headers[i]] = values[i] ?? "";
    // Keep a practical nationwide set: main campuses and predominantly 4-year schools.
    if (toNumber(row.MAIN) !== 1) continue;
    if (toNumber(row.PREDDEG) !== 3) continue;
    if (!row.UNITID || !row.INSTNM) continue;

    const target = byName.get(normalizeName(row.INSTNM ?? ""));
    const website = row.INSTURL
      ? `https://${row.INSTURL.replace(/^https?:\/\//, "")}`
      : target?.website ?? null;
    const resolvedWebsite = website ?? target?.website ?? null;
    const logo = resolveUniversityLogo({ website, name: row.INSTNM, explicitLogoUrl: null });
    const normalized = {
      externalId: row.UNITID || null,
      name: row.INSTNM,
      slug: slugify(row.INSTNM),
      city: row.CITY || null,
      state: row.STABBR || null,
      control: controlLabel(row.CONTROL),
      level: toNumber(row.PREDDEG) === 3 ? "4-year" : null,
      website: resolvedWebsite,
      logoUrl: logo.logoUrl,
      logoSource: logo.logoSource,
      address: null,
      phone: null,
      applicationFee: toNumber(row.APPL_FEE),
      tuitionInState: toNumber(row.TUITIONFEE_IN),
      tuitionOutOfState: toNumber(row.TUITIONFEE_OUT),
      averageAnnualCost: toNumber(row.COSTT4_A),
      housingAvailable: toBoolFromPct(row.HOUSING_PCT),
      housingCost: null,
      campusSetting: localeToSetting(row.LOCALE),
      acceptanceRate: toNumber(row.ADM_RATE),
      graduationRate: toNumber(row.C150_4),
      medianEarnings: null,
      undergradEnrollment: toNumber(row.UGDS),
      totalEnrollment: toNumber(row.UGDS),
      testingPolicy: null,
      admissionsDeadlineED: null,
      admissionsDeadlineEA: null,
      admissionsDeadlineRD: null,
      popularMajors: null,
      notes: null,
      sourceCoreName: "College Scorecard Raw Data (local file)",
      sourceAdmissionsName: "Official university admissions websites",
      sourceBrandName: "Logo.dev + favicon fallback",
      sourceCoreUrl: "https://collegescorecard.ed.gov/data/",
      sourceAdmissionsUrl: target?.admissionsUrl ?? null,
      sourceBrandUrl: resolvedWebsite,
      sourceName: "Hybrid local pipeline",
      sourceUrl: "https://collegescorecard.ed.gov/data/",
      rawSourcePayload: JSON.stringify(row),
      lastVerifiedAt: new Date(),
    };
    loadedByExternalId.set(row.UNITID, normalized);
  }
  rl.close();

  return {
    loaded: Array.from(loadedByExternalId.values()),
    loadedNames: Array.from(loadedByExternalId.values())
      .slice(0, 50)
      .map((v) => v.name),
    notFoundTargets: universityIngestionTargets
      .filter((t) => !Array.from(loadedByExternalId.values()).some((r) => normalizeName(r.name) === normalizeName(t.name)))
      .map((t) => t.name),
  };
}
