import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCounselorProfile } from "@/lib/counselorAuth";
import { prisma } from "@/server/prisma";

const updateSchema = z.object({
  organization: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  specialisations: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  maxStudents: z.number().int().min(1).max(200).optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { name: true, email: true, image: true },
  });

  return NextResponse.json({
    profile: auth.profile,
    user,
    specialisations: auth.profile.specialisations
      ? auth.profile.specialisations.split(",").filter(Boolean)
      : [],
  });
}

export async function PUT(req: Request) {
  const auth = await requireCounselorProfile();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  }

  const data = parsed.data;
  const profile = await prisma.counselorProfile.update({
    where: { id: auth.profile.id },
    data: {
      organization: data.organization,
      bio: data.bio,
      yearsExperience: data.yearsExperience,
      maxStudents: data.maxStudents,
      onboardingComplete: data.onboardingComplete,
      specialisations: data.specialisations ? data.specialisations.join(",") : undefined,
    },
  });

  return NextResponse.json({
    profile,
    specialisations: profile.specialisations.split(",").filter(Boolean),
  });
}
