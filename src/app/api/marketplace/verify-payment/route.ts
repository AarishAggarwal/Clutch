import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarketplaceApplication } from "@/lib/marketplaceCatalog";
import { signUnlockToken, unlockCookieName } from "@/lib/marketplaceUnlock";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    applicationId?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !applicationId) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const application = getMarketplaceApplication(applicationId);
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    return NextResponse.json({ error: "Payment verification is not configured." }, { status: 500 });
  }

  const generated = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated !== razorpay_signature) {
    return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
  }

  const token = signUnlockToken(session.user.id, applicationId, razorpay_payment_id);
  const res = NextResponse.json({
    success: true,
    applicationId,
    paymentId: razorpay_payment_id,
  });
  res.cookies.set(unlockCookieName(applicationId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
