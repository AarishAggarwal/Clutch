import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/universities/:path*",
    "/essays/:path*",
    "/activities/:path*",
    "/locker/:path*",
    "/scholarships/:path*",
    "/marketplace/:path*",
    "/profile/:path*",
    "/documents/:path*",
    "/counselor/:path*",
    "/auth/complete-profile",
  ],
};
