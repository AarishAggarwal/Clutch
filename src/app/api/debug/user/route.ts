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
    select: { id: true, emailVerified: true, role: true, createdAt: true, passwordHash: true },
  });

  const latestOtp = await prisma.emailOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { expiresAt: true, attempts: true, createdAt: true },
  });

  return NextResponse.json({
    email,
    user: user
      ? {
          id: user.id,
          emailVerified: user.emailVerified,
          role: user.role,
          createdAt: user.createdAt,
          hasPasswordHash: Boolean(user.passwordHash),
        }
      : null,
    latestOtp: latestOtp
      ? {
          expiresAt: latestOtp.expiresAt,
          attempts: latestOtp.attempts,
          createdAt: latestOtp.createdAt,
        }
      : null,
  });
}

