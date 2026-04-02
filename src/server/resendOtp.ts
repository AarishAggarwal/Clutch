import { Resend } from "resend";

export async function sendSignupOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("RESEND_API_KEY is missing");
  }
  const resend = new Resend(apiKey);
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() || "Clutch Edu <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Your Clutch Edu verification code",
    html: `
      <p>Your verification code is:</p>
      <p style="font-size:26px;font-weight:700;letter-spacing:0.25em;font-family:system-ui,sans-serif">${code}</p>
      <p style="color:#555;font-size:14px">This code expires in 15 minutes. If you did not sign up, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
