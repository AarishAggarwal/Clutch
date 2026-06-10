import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/prisma";

export async function getCounselorSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "counselor") return null;
  return session;
}

export async function getOrCreateCounselorProfile(userId: string) {
  const existing = await prisma.counselorProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.counselorProfile.create({ data: { userId } });
}

export async function requireCounselorProfile() {
  const session = await getCounselorSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const profile = await getOrCreateCounselorProfile(session.user.id);
  return { session, profile };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
