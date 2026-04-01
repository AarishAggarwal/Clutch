import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { profileInputSchema } from "@/lib/workspaceSchemas";
import { toStudentId } from "@/lib/studentId";

export async function GET() {
  let profile = await prisma.studentProfile.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: {
        fullName: "",
        intendedMajors: "",
        interests: "",
      },
    });
  }
  return NextResponse.json({ profile, studentId: toStudentId(profile.id) });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = profileInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });

  const existing = await prisma.studentProfile.findFirst({ orderBy: { updatedAt: "desc" } });
  const profile = existing
    ? await prisma.studentProfile.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          intendedMajors: parsed.data.intendedMajors ?? "",
          interests: parsed.data.interests ?? "",
        },
      })
    : await prisma.studentProfile.create({
        data: {
          ...parsed.data,
          intendedMajors: parsed.data.intendedMajors ?? "",
          interests: parsed.data.interests ?? "",
        },
      });
  return NextResponse.json({ profile, studentId: toStudentId(profile.id) });
}
