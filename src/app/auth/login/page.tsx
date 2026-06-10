"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthErrorCallout from "@/components/auth/AuthErrorCallout";
import { getAuthErrorPresentation } from "@/lib/authErrors";

const LAST_LOGIN_EMAIL_KEY = "clutch:lastLoginEmail";

type AuthRole = "student" | "counselor" | "specialist";

function roleLabel(role: AuthRole) {
  if (role === "counselor") return "Counselor";
  if (role === "specialist") return "Specialist/Alumni";
  return "Student";
}

function defaultCallback(role: AuthRole) {
  if (role === "counselor") return "/counselor/dashboard";
  if (role === "specialist") return "/specialist";
  return "/dashboard";
}

function LoginContent() {
  const search = useSearchParams();
  const role = (search.get("role") ?? "student").toLowerCase() as AuthRole;
  const callbackUrl = search.get("callbackUrl") || defaultCallback(role);
  const label = roleLabel(role);
  const isStudent = role === "student";
  const isCounselor = role === "counselor";
  const loginRole = isStudent || isCounselor ? role : null;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorPresentation, setErrorPresentation] = React.useState<ReturnType<typeof getAuthErrorPresentation>>(null);
  const [credentialExtraHint, setCredentialExtraHint] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const code = search.get("error");
    setErrorPresentation(getAuthErrorPresentation(code));
    setCredentialExtraHint(null);
    if (code !== "CredentialsSignin" || typeof window === "undefined") return;

    const stored = sessionStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (!stored) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/sign-in-hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: stored }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          hasPasswordLogin?: boolean;
          hasGoogleLogin?: boolean;
          role?: string;
        };
        if (loginRole && data.role && data.role !== loginRole) {
          const actual =
            data.role === "counselor" ? "counselor" : data.role === "specialist" ? "specialist" : "student";
          setCredentialExtraHint(
            `This email is registered as a ${actual} account. Try logging in with the ${actual} login instead.`,
          );
          return;
        }
        if (data.hasGoogleLogin && !data.hasPasswordLogin) {
          setCredentialExtraHint(
            "This email is set up for Google sign-in. Use “Continue with Google” below instead of your password.",
          );
        } else if (data.hasPasswordLogin && !data.hasGoogleLogin) {
          setCredentialExtraHint("This email uses a password only—Google isn’t connected for this account yet.");
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, loginRole]);

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorPresentation(null);
    setCredentialExtraHint(null);
    setLoading(true);
    try {
      try {
        sessionStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.trim().toLowerCase());
      } catch {
        /* ignore */
      }
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        expectedRole: loginRole ?? undefined,
        redirect: true,
        callbackUrl,
      });

      if (res?.error) {
        setErrorPresentation(getAuthErrorPresentation(res.error));
      }
    } finally {
      setLoading(false);
    }
  }

  function onGoogle() {
    setErrorPresentation(null);
    setCredentialExtraHint(null);
    void signIn("google", { callbackUrl: "/auth/complete-profile" });
  }

  if (!loginRole) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="page-wrap max-w-2xl py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="btn-ghost text-sm">
              ← Back
            </Link>
          </div>
          <section className="panel p-6 sm:p-8">
            <h1 className="display-title text-2xl sm:text-3xl">{label} login</h1>
            <p className="page-subtitle mt-2">
              Specialist and alumni accounts are coming soon. For now, sign up or log in as a student or counselor.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/auth/login?role=student" className="btn-primary">
                Student login
              </Link>
              <Link href="/auth/login?role=counselor" className="btn-secondary">
                Counselor login
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-2xl py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="btn-ghost text-sm">
            ← Back
          </Link>
          <Link href={`/auth/signup?role=${role}`} className="btn-secondary text-sm">
            Need an account? Sign up
          </Link>
        </div>

        <section className="panel p-6 sm:p-8">
          <h1 className="display-title text-2xl sm:text-3xl">{label} login</h1>
          <p className="page-subtitle mt-1">
            {isCounselor
              ? "Use the email and password you verified when you created your counselor account."
              : "Use the email and password you verified, or continue with Google."}
          </p>

          {errorPresentation ? (
            <AuthErrorCallout presentation={errorPresentation} extraHint={credentialExtraHint} />
          ) : null}

          <form onSubmit={onCredentialsSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base w-full"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base w-full"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {isStudent ? (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: "var(--border-soft)" }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="px-2" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                    or
                  </span>
                </div>
              </div>

              <button type="button" onClick={onGoogle} className="btn-secondary w-full">
                Continue with Google
              </button>
              <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                Google sign-in skips email OTP because Google already verified your address.
              </p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="page-wrap max-w-2xl py-10">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading…
          </p>
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
