import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { z } from "zod";

const CATEGORY = "CounselorRoster";
const TITLE = "default";

const bodySchema = z.object({
  studentId: z.string().min(3),
  action: z.enum(["add", "remove"]).default("add"),
});

async function readRoster(): Promise<string[]> {
  const doc = await prisma.document.findFirst({
    where: { category: CATEGORY, title: TITLE },
    orderBy: { updatedAt: "desc" },
  });
  if (!doc) return [];
  try {
    const parsed = JSON.parse(doc.content) as string[];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeRoster(ids: string[]) {
  const existing = await prisma.document.findFirst({
    where: { category: CATEGORY, title: TITLE },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: { content: JSON.stringify(ids), tags: JSON.stringify(["counselor", "roster"]) },
    });
    return;
  }
  await prisma.document.create({
    data: {
      title: TITLE,
      category: CATEGORY,
      content: JSON.stringify(ids),
      tags: JSON.stringify(["counselor", "roster"]),
    },
  });
}

export async function GET() {
  const studentIds = await readRoster();
  return NextResponse.json({ studentIds });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const current = await readRoster();
  const id = parsed.data.studentId.trim().toUpperCase();
  const next =
    parsed.data.action === "remove"
      ? current.filter((x) => x.toUpperCase() !== id)
      : Array.from(new Set([id, ...current]));
  await writeRoster(next);
  return NextResponse.json({ studentIds: next });
}

