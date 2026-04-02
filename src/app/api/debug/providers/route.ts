import { NextResponse } from "next/server";

export async function GET() {
  const googleClientIdPresent = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
  const googleClientSecretPresent = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

  return NextResponse.json({
    google: {
      enabled: googleClientIdPresent && googleClientSecretPresent,
      GOOGLE_CLIENT_ID_present: googleClientIdPresent,
      GOOGLE_CLIENT_SECRET_present: googleClientSecretPresent,
    },
    nextAuth: {
      NEXTAUTH_URL_present: Boolean(process.env.NEXTAUTH_URL?.trim()),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      NEXTAUTH_SECRET_present: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    },
  });
}

