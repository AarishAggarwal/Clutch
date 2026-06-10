/**
 * User-facing auth messaging. Maps NextAuth `error` query / client codes to copy
 * without exposing internal error identifiers.
 *
 * Future: when account linking ships, branch on `audience` to offer "Link accounts"
 * or unified identity flows instead of only guidance text.
 */
export type AuthErrorAudience =
  | "generic"
  | "use_password_instead_of_google"
  | "use_google_instead_of_password";

export type AuthErrorPresentation = {
  title: string;
  body: string;
  /** Optional subtle line (e.g. roadmap / support), still non-technical */
  footnote?: string;
  audience: AuthErrorAudience;
};

const UNIFIED_LOGIN_FOOTNOTE =
  "One account per email — sign in with your password or Google, whichever you prefer.";

/** NextAuth error query param values we care about */
const KNOWN_CODES = new Set([
  "OAuthAccountNotLinked",
  "CredentialsSignin",
  "OAuthSignin",
  "OAuthCallback",
  "OAuthCreateAccount",
  "EmailSignin",
  "SessionRequired",
  "AccessDenied",
  "Configuration",
  "Verification",
  "Default",
]);

export function getAuthErrorPresentation(errorCode: string | null | undefined): AuthErrorPresentation | null {
  if (!errorCode?.trim()) return null;
  const code = errorCode.trim();

  switch (code) {
    case "OAuthAccountNotLinked":
      return {
        title: "Could not connect Google to this email",
        body: "Try signing in with your email and password, or use a different Google account.",
        footnote: UNIFIED_LOGIN_FOOTNOTE,
        audience: "generic",
      };
    case "CredentialsSignin":
      return {
        title: "We couldn’t sign you in",
        body: "Double-check your email and password. If you recently signed up, make sure you verified your email with the code we sent.",
        audience: "generic",
      };
    case "OAuthSignin":
      return {
        title: "Google sign-in didn’t start",
        body: "Something blocked the connection to Google. Try again in a moment, or use email and password if you have them.",
        audience: "generic",
      };
    case "OAuthCallback":
      return {
        title: "Google sign-in was interrupted",
        body: "We couldn’t finish connecting to Google. Try again, or sign in with your email and password.",
        audience: "generic",
      };
    case "AccessDenied":
      return {
        title: "Sign-in was cancelled",
        body: "You can try again when you’re ready.",
        audience: "generic",
      };
    case "Configuration":
      return {
        title: "Sign-in is temporarily unavailable",
        body: "Please try again later or contact support if this keeps happening.",
        audience: "generic",
      };
    case "SessionRequired":
      return {
        title: "Your session ended",
        body: "Please sign in again to continue.",
        audience: "generic",
      };
    default:
      if (KNOWN_CODES.has(code)) {
        return {
          title: "Something went wrong",
          body: "We couldn’t complete sign-in. Try again, or use another sign-in option if you have one.",
          audience: "generic",
        };
      }
      return {
        title: "Something went wrong",
        body: "We couldn’t complete sign-in. Please try again.",
        audience: "generic",
      };
  }
}

/**
 * Maps `signIn(..., { redirect: false })` error strings to the same presentations
 * where codes match; unknown values get a generic presentation (no raw code).
 */
export function presentationFromSignInError(error: string | undefined): AuthErrorPresentation | null {
  return getAuthErrorPresentation(error ?? null);
}
