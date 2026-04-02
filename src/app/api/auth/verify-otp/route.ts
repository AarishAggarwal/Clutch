import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 8;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { code } = parsed.data;

  const otp = await prisma.emailOtp.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Invalid or expired code. Request a new one from sign up." }, { status: 400 });
  }

  const ok = await bcrypt.compare(code, otp.codeHash);
  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (!ok) {
    return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });
  await prisma.emailOtp.deleteMany({ where: { email } });

  return NextResponse.json({ ok: true });
}
