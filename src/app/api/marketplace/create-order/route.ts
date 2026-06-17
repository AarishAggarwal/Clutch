import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarketplaceApplication, marketplaceAmountPaise } from "@/lib/marketplaceCatalog";
import { getRazorpayClient, getRazorpayPublicKey } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { applicationId?: string };
  try {
    body = (await req.json()) as { applicationId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const application = body.applicationId ? getMarketplaceApplication(body.applicationId) : undefined;
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const amount = marketplaceAmountPaise(application);
  if (amount < 100) {
    return NextResponse.json({ error: "Amount must be at least 100 paise." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    const receipt = `app_${application.id}_${Date.now()}`.slice(0, 40);
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        applicationId: application.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getRazorpayPublicKey(),
      applicationId: application.id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Razorpay order creation failed.";
    const status = message.toLowerCase().includes("auth") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
