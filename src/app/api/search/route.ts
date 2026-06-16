import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ essays: [], comments: [], universities: [] });

  const userId = session.user.id;
  const [essays, universities] = await Promise.all([
    prisma.essay.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { plainText: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, title: true, essayType: true, wordCount: true },
    }),
    prisma.university.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, name: true, slug: true, city: true, state: true },
    }),
  ]);

  const essayIds = essays.map((e) => e.id);
  const comments = essayIds.length
    ? await prisma.essayComment.findMany({
        where: {
          essayId: { in: essayIds },
          content: { contains: q, mode: "insensitive" },
          resolved: false,
        },
        take: 8,
        select: { id: true, essayId: true, content: true, quotedText: true },
      })
    : [];

  return NextResponse.json({
    essays: essays.map((e) => ({ ...e, href: `/essays?id=${e.id}` })),
    comments: comments.map((c) => ({ ...c, href: `/essays?id=${c.essayId}` })),
    universities: universities.map((u) => ({ ...u, href: `/universities/${u.slug}` })),
  });
}
