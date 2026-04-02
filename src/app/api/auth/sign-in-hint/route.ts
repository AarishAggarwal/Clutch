import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";

const bodySchema = z.object({
  email: z.string().email().max(320),
});

/**
 * Returns which sign-in methods exist for an email (after a failed attempt).
 * Used only to show friendlier copy—not for security decisions.
 * Note: reveals whether an account exists (common login UX tradeoff).
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      passwordHash: true,
      emailVerified: true,
      accounts: { select: { provider: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ hasPasswordLogin: false, hasGoogleLogin: false });
  }

  const hasGoogleLogin = user.accounts.some((a) => a.provider === "google");
  const hasPasswordLogin = Boolean(user.passwordHash && user.emailVerified);

  return NextResponse.json({ hasPasswordLogin, hasGoogleLogin });
}
