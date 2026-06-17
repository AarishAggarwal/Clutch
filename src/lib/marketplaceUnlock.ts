import crypto from "crypto";
import path from "path";

const COOKIE_PREFIX = "mp_unlock_";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!s) throw new Error("Missing NEXTAUTH_SECRET for marketplace unlock tokens.");
  return s;
}

export function unlockCookieName(applicationId: string): string {
  return `${COOKIE_PREFIX}${applicationId}`;
}

export function signUnlockToken(userId: string, applicationId: string, paymentId: string): string {
  const payload = JSON.stringify({ userId, applicationId, paymentId, ts: Date.now() });
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyUnlockToken(
  token: string,
  userId: string,
  applicationId: string,
): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
    if (expected !== sig) return false;
    const data = JSON.parse(payload) as { userId: string; applicationId: string; paymentId: string };
    return data.userId === userId && data.applicationId === applicationId;
  } catch {
    return false;
  }
}

export function resolveApplicationPdfPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}
