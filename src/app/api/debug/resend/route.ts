import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  return NextResponse.json({
    resend: {
      RESEND_API_KEY_present: Boolean(apiKey?.trim()),
      RESEND_API_KEY_length: apiKey?.length ?? 0,
      // Don't print the full value; just show the sender domain-ish part.
      AUTH_EMAIL_FROM_present: Boolean(from?.trim()),
      AUTH_EMAIL_FROM: from
        ? String(from).replace(/(.{2}).+(@.+)/, "$1***$2")
        : null,
    },
  });
}

