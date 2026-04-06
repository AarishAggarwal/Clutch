/**
 * Full university catalog sync from the U.S. Dept. of Education College Scorecard API
 * into Postgres (`University` table). Intended to run locally or in CI — not during HTTP requests.
 *
 * Prerequisites:
 *  - `COLLEGE_SCORECARD_API_KEY` from https://api.data.gov/signup/
 *  - `DATABASE_URL` pointing at your Neon/Postgres database (same one Vercel uses)
 *
 * Usage:
 *   npm run db:sync-universities-api
 *
 * Optional: MAX_SCHOOLS=500 (or any number) for a partial import instead of the full catalog.
 *
 * Or (cmd.exe):
 *   set COLLEGE_SCORECARD_API_KEY=your_key
 *   set DATABASE_URL=postgresql://...
 *   set MAX_SCHOOLS=500
 *   npx tsx scripts/sync-universities-api.ts
 */
import { ingestAllSchoolsFromScorecardApi } from "../src/server/universities/scorecardApiIngestion";
import { prisma } from "../src/server/prisma";

async function main() {
  const key = process.env.COLLEGE_SCORECARD_API_KEY?.trim();
  if (!key) {
    console.error("Missing COLLEGE_SCORECARD_API_KEY.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  const maxRaw = process.env.MAX_SCHOOLS?.trim();
  const maxSchools = maxRaw ? Math.max(1, parseInt(maxRaw, 10) || 0) : undefined;
  if (maxSchools) {
    console.log(`Syncing up to ${maxSchools} schools (MAX_SCHOOLS)…`);
  } else {
    console.log("Syncing universities from College Scorecard API (can take several minutes for a full catalog)…");
  }
  const result = await ingestAllSchoolsFromScorecardApi(key, { maxSchools });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
