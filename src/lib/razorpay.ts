import Razorpay from "razorpay";

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are not configured.");
  }
  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayPublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || process.env.RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured.");
  return key;
}
