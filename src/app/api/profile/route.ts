import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/prisma";
import { profileInputSchema } from "@/lib/workspaceSchemas";
import { toStudentId } from "@/lib/studentId";
import { authOptions } from "@/lib/auth";

function formatProfile(profile: NonNullable<Awaited<ReturnType<typeof prisma.studentProfile.findUnique>>>) {
  let academicData: Record<string, unknown> | null = null;
  if (profile.academicData) {
    try {
      academicData = JSON.parse(profile.academicData) as Record<string, unknown>;
    } catch {
      academicData = null;
    }
  }
  return { ...profile, academicData };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "counselor") {
    return NextResponse.json({ error: "Counselor accounts do not have a student profile." }, { status: 403 });
  }

  let profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: {
        userId: session.user.id,
        fullName: session.user.name ?? "",
        intendedMajors: "",
        interests: "",
      },
    });
  }
  return NextResponse.json({ profile: formatProfile(profile), studentId: toStudentId(profile.id) });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "counselor") {
    return NextResponse.json({ error: "Counselor accounts do not have a student profile." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = profileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = {
    fullName: parsed.data.fullName ?? undefined,
    graduationYear: parsed.data.graduationYear ?? undefined,
    schoolName: parsed.data.schoolName ?? undefined,
    gpa: parsed.data.gpa ?? undefined,
    sat: parsed.data.sat ?? undefined,
    act: parsed.data.act ?? undefined,
    intendedMajors: parsed.data.intendedMajors ?? "",
    courseworkSummary: parsed.data.courseworkSummary ?? undefined,
    location: parsed.data.location ?? undefined,
    interests: parsed.data.interests ?? "",
    notes: parsed.data.notes ?? undefined,
    pronouns: parsed.data.pronouns ?? undefined,
    boardSystem: parsed.data.boardSystem ?? undefined,
    academicData: parsed.data.academicData ? JSON.stringify(parsed.data.academicData) : undefined,
  };

  const profile = await prisma.studentProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ profile: formatProfile(profile), studentId: toStudentId(profile.id) });
}
