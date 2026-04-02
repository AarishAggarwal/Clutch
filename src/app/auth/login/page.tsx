"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthErrorCallout from "@/components/auth/AuthErrorCallout";
import { getAuthErrorPresentation } from "@/lib/authErrors";

const LAST_LOGIN_EMAIL_KEY = "clutch:lastLoginEmail";

function LoginContent() {
  const search = useSearchParams();
  const role = (search.get("role") ?? "student").toLowerCase();
  const callbackUrl = search.get("callbackUrl") || (role === "counselor" ? "/counselor" : role === "specialist" ? "/specialist" : "/dashboard");
  const roleLabel = role === "counselor" ? "Counselor" : role === "specialist" ? "Specialist/Alumni" : "Student";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorPresentation, setErrorPresentation] = React.useState<ReturnType<typeof getAuthErrorPresentation>>(null);
  const [credentialExtraHint, setCredentialExtraHint] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // NextAuth redirects back with an `error=` query param on auth failure — map to user-facing copy (no raw codes).
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
        const data = (await res.json()) as { hasPasswordLogin?: boolean; hasGoogleLogin?: boolean };
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
  }, [search]);

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
      // Let NextAuth perform the redirect so the session cookie is definitely set
      // before middleware runs.
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: true,
        callbackUrl,
      });

      // If sign-in fails without full redirect, NextAuth may return `res.error` here.
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
    void signIn("google", { callbackUrl });
  }

  if (role !== "student") {
    return (
      <div className="h-full overflow-y-auto">
        <div className="page-wrap max-w-2xl py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="btn-ghost text-sm">
              ← Back
            </Link>
          </div>
          <section className="panel p-6 sm:p-8">
            <h1 className="page-title">{roleLabel} login</h1>
            <p className="page-subtitle mt-2">
              Beta workspace accounts use the student sign-up flow. Counselor and specialist tooling is coming next; for now please use a student account to explore the product.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/auth/login?role=student" className="btn-primary">
                Log in as student
              </Link>
              <Link href="/auth/signup?role=student" className="btn-secondary">
                Create student account
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
          <Link href="/auth/signup?role=student" className="btn-secondary text-sm">
            Need an account? Sign up
          </Link>
        </div>

        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Student login</h1>
          <p className="page-subtitle mt-1">Use the email and password you verified, or continue with Google.</p>

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
