import { Resend } from "resend";

function resendErrorMessage(error: { message?: string; name?: string } | null): string {
  if (!error) return "Resend returned an unknown error.";
  const parts = [error.name, error.message].filter((x): x is string => Boolean(x?.trim()));
  return parts.length ? parts.join(": ") : "Resend returned an unknown error.";
}

/**
 * Sends the signup OTP. Requires RESEND_API_KEY in all deployed environments.
 *
 * Resend note: `onboarding@resend.dev` is for testing only and typically can only
 * deliver to your Resend account email. For real users on other addresses, verify
 * a domain at resend.com and set AUTH_EMAIL_FROM to an address on that domain.
 */
export async function sendSignupOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("RESEND_API_KEY is missing on the server. Add it in Vercel → Settings → Environment Variables (Production).");
  }
  const resend = new Resend(apiKey);
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() || "ClutchAI <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Your ClutchAI verification code",
    html: `
      <p>Your verification code is:</p>
      <p style="font-size:26px;font-weight:700;letter-spacing:0.25em;font-family:system-ui,sans-serif">${code}</p>
      <p style="color:#555;font-size:14px">This code expires in 15 minutes. If you did not sign up, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(resendErrorMessage(error));
  }
}
