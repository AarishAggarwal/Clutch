import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const path = req.nextUrl.pathname;

  if (!token) {
    const login = new URL("/auth/login", req.url);
    if (path.startsWith("/counselor")) {
      login.searchParams.set("role", "counselor");
    }
    login.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (path.startsWith("/counselor") && token.role !== "counselor") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/application-preview",
    "/application-preview/:path*",
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
    "/projects/:path*",
  ],
};
