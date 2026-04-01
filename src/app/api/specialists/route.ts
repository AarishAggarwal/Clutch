import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { z } from "zod";

const CATEGORY = "SpecialistProfile";

const specialistSchema = z.object({
  fullName: z.string().min(2),
  roleType: z.enum(["specialist", "alumni"]).default("specialist"),
  headline: z.string().min(2),
  bio: z.string().min(2),
  expertise: z.string().min(2),
  priceDisplay: z.string().min(1),
});

type SpecialistDoc = {
  id: string;
  fullName: string;
  roleType: "specialist" | "alumni";
  headline: string;
  bio: string;
  expertise: string;
  priceDisplay: string;
  createdAt?: string;
};

function parseSpecialist(content: string): SpecialistDoc | null {
  try {
    return JSON.parse(content) as SpecialistDoc;
  } catch {
    return null;
  }
}

export async function GET() {
  const docs = await prisma.document.findMany({
    where: { category: CATEGORY },
    orderBy: { updatedAt: "desc" },
  });
  const specialists = docs
    .map((d) => parseSpecialist(d.content))
    .filter((x): x is SpecialistDoc => Boolean(x));
  return NextResponse.json({ specialists });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = specialistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid specialist profile payload." }, { status: 400 });
  }

  const specialist: SpecialistDoc = {
    id: `SPC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  await prisma.document.create({
    data: {
      title: specialist.fullName,
      category: CATEGORY,
      content: JSON.stringify(specialist),
      tags: JSON.stringify(["marketplace", "specialist", specialist.roleType]),
    },
  });

  return NextResponse.json({ specialist }, { status: 201 });
}

