import { NextResponse } from "next/server";
import { getUniversityBySlug } from "@/server/universities/universityService";

export async function GET(_: Request, ctx: { params: { slug: string } }) {
  const university = await getUniversityBySlug(ctx.params.slug);
  if (!university) return NextResponse.json({ error: "University not found." }, { status: 404 });
  return NextResponse.json({ university });
}
