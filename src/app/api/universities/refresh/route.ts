import { NextResponse } from "next/server";
import { forceRefreshUniversitiesFromSources } from "@/server/universities/universityService";

export async function POST() {
  const report = await forceRefreshUniversitiesFromSources();
  return NextResponse.json({ ok: true, report });
}
