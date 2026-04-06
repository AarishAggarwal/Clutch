/**
 * Full university catalog sync from the U.S. Dept. of Education College Scorecard API
 * into Postgres (`University` table). Intended to run locally or in CI — not during HTTP requests.
 *
 * Prerequisites:
 *  - `COLLEGE_SCORECARD_API_KEY` from https://api.data.gov/signup/
 *  - `DATABASE_URL` pointing at your Neon/Postgres database (same one Vercel uses)
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/sync-universities-api.ts
 *
 * Or (cmd.exe):
 *   set COLLEGE_SCORECARD_API_KEY=your_key
 *   set DATABASE_URL=postgresql://...
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

  console.log("Syncing universities from College Scorecard API (several minutes)…");
  const result = await ingestAllSchoolsFromScorecardApi(key);
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
