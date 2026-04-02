import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const hasSecret = Boolean(process.env.NEXTAUTH_SECRET?.trim());
  const hasUrl = Boolean(process.env.NEXTAUTH_URL?.trim());

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return NextResponse.json({
    host: req.headers.get("host"),
    nextAuth: {
      NEXTAUTH_URL_present: hasUrl,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      NEXTAUTH_SECRET_present: hasSecret,
    },
    auth: {
      hasToken: Boolean(token),
      sub: token?.sub ?? null,
      role: (token as any)?.role ?? null,
    },
  });
}

