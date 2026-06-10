/**
 * Removes every row from User (cascades accounts, sessions, profiles, essays, activities)
 * and clears EmailOtp.
 *
 * cmd.exe — do NOT put quotes around the URL (or the quotes become part of the value):
 *   set CONFIRM_DELETE_ALL_USERS=YES
 *   set DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
 *   npm run db:delete-all-users
 *
 * Or create `.env.neon` (gitignored) with DATABASE_URL=postgresql://...
 * and run the same two set lines for CONFIRM only, or use:
 *   set CONFIRM_DELETE_ALL_USERS=YES
 *   npm run db:delete-all-users
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function stripQuotes(value) {
  let s = String(value).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = stripQuotes(trimmed.slice(eq + 1));
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.neon");

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = stripQuotes(process.env.DATABASE_URL);
}

if (process.env.CONFIRM_DELETE_ALL_USERS !== "YES") {
  console.error("Refusing to run: set CONFIRM_DELETE_ALL_USERS=YES");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error(
    'DATABASE_URL is missing. Set it in cmd (no quotes), or add it to .env.neon in the project root.\nExample: DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require',
  );
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
  const preview = dbUrl.length > 24 ? `${dbUrl.slice(0, 24)}…` : dbUrl;
  console.error(
    `DATABASE_URL must start with postgresql:// or postgres://.\n` +
      `After trimming, it starts with: ${JSON.stringify(preview)}\n` +
      `In cmd, use: set DATABASE_URL=postgresql://... (no wrapping "quotes").`,
  );
  process.exit(1);
}

const p = new PrismaClient();

try {
  const before = await p.user.count();
  const otpBefore = await p.emailOtp.count();
  await p.emailOtp.deleteMany({});
  const del = await p.user.deleteMany({});
  console.log(
    JSON.stringify(
      {
        usersDeleted: del.count,
        usersExpected: before,
        emailOtpsDeleted: otpBefore,
        ok: del.count === before,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await p.$disconnect();
}
