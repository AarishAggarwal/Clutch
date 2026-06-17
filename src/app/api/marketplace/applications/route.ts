import { NextResponse } from "next/server";
import { MARKETPLACE_APPLICATIONS } from "@/lib/marketplaceCatalog";

export async function GET() {
  return NextResponse.json({
    applications: MARKETPLACE_APPLICATIONS.map((a) => ({
      id: a.id,
      universityShort: a.universityShort,
      universityFull: a.universityFull,
      studentName: a.studentName,
      admissionYear: a.admissionYear,
      program: a.program,
      priceInr: a.priceInr,
      previewLines: a.previewLines,
    })),
  });
}
