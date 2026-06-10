import { prisma } from "@/server/prisma";
import { toStudentId } from "@/lib/studentId";

export async function findStudentProfileByCode(code: string) {
  const want = code.trim().toUpperCase();
  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  return profiles.find((p) => toStudentId(p.id).toUpperCase() === want) ?? null;
}
