import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/server/prisma";
import { sendSignupOtpEmail } from "@/server/resendOtp";

const bodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Use a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerified) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (existing && !existing.emailVerified) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    await prisma.emailOtp.create({ data: { email, codeHash, expiresAt } });
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "student",
      },
    });
    await prisma.emailOtp.create({ data: { email, codeHash, expiresAt } });
  }

  try {
    await sendSignupOtpEmail(email, code);
  } catch (e) {
    console.error("[register] Resend error:", e);
    return NextResponse.json(
      {
        error:
          "Could not send verification email. Confirm RESEND_API_KEY and AUTH_EMAIL_FROM (verified domain on Resend).",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
