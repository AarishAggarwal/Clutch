import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Missing ?email=" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, role: true, createdAt: true, name: true },
  });

  const accounts = await prisma.account.findMany({
    where: { userId: user?.id },
    orderBy: { id: "desc" },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      type: true,
    },
  });

  return NextResponse.json({
    email,
    user,
    googleLikeAccounts: accounts.filter((a) => a.provider.toLowerCase().includes("google")),
  });
}

