import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { toStudentId } from "@/lib/studentId";
import { z } from "zod";

const CATEGORY = "MarketplaceConnectRequest";

const connectSchema = z.object({
  specialistId: z.string().min(3),
  specialistName: z.string().min(2),
});

export async function GET() {
  const docs = await prisma.document.findMany({
    where: { category: CATEGORY },
    orderBy: { updatedAt: "desc" },
  });
  const requests = docs
    .map((d) => {
      try {
        return JSON.parse(d.content) as {
          requestId: string;
          specialistId: string;
          specialistName: string;
          studentId: string;
          studentName: string;
          createdAt: string;
        };
      } catch {
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connect request payload." }, { status: 400 });
  }

  const profile = await prisma.studentProfile.findFirst({ orderBy: { updatedAt: "desc" } });
  const studentId = profile ? toStudentId(profile.id) : "STU-UNKNOWN";
  const studentName = profile?.fullName || "Unnamed student";

  const payload = {
    requestId: `REQ-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    specialistId: parsed.data.specialistId,
    specialistName: parsed.data.specialistName,
    studentId,
    studentName,
    createdAt: new Date().toISOString(),
  };

  await prisma.document.create({
    data: {
      title: `${payload.studentId} -> ${payload.specialistName}`,
      category: CATEGORY,
      content: JSON.stringify(payload),
      tags: JSON.stringify(["marketplace", "connect", payload.specialistId, payload.studentId]),
    },
  });

  return NextResponse.json({ ok: true, request: payload }, { status: 201 });
}

