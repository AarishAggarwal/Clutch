"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type Step = "account" | "otp";

function StudentSignupWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("account");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start sign up.");
        return;
      }
      setStep("otp");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otp.replace(/\D/g, "").slice(0, 6) }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError("Verified, but sign-in failed. Try logging in manually.");
        return;
      }
      router.push("/auth/complete-profile");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onGoogle() {
    setError(null);
    void signIn("google", { callbackUrl: "/auth/complete-profile" });
  }

  async function resendCode() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Go back to step 1 if you need to change email or password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not resend code.");
        return;
      }
    } finally {
      setBusy(false);
    }
  }

  if (step === "account") {
    return (
      <>
        <h1 className="page-title">Create your student account</h1>
        <p className="page-subtitle mt-1">
          Enter your school email and a password. We will email you a one-time code to verify before you finish your profile.
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={submitAccount} className="mt-6 grid gap-4">
          <div>
            <label className="field-label" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="su-password">
              Password
            </label>
            <input
              id="su-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base w-full"
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              At least 8 characters.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="su-confirm">
              Confirm password
            </label>
            <input
              id="su-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Sending code…" : "Continue — send verification code"}
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
          Sign up with Google
        </button>
        <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          With Google we skip the email code and take you straight to profile setup.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Verify your email</h1>
      <p className="page-subtitle mt-1">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below (expires in 15 minutes).
      </p>
      {error ? (
        <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      <form onSubmit={submitOtp} className="mt-6 grid gap-4">
        <div>
          <label className="field-label" htmlFor="su-otp">
            Verification code
          </label>
          <input
            id="su-otp"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="input-base w-full text-center text-2xl tracking-[0.4em]"
            placeholder="000000"
          />
        </div>
        <button type="submit" disabled={busy || otp.length !== 6} className="btn-primary w-full disabled:opacity-60">
          {busy ? "Verifying…" : "Verify and continue"}
        </button>
      </form>
      <button type="button" onClick={() => void resendCode()} disabled={busy} className="btn-ghost mt-4 text-sm">
        Resend code
      </button>
      <button type="button" onClick={() => setStep("account")} className="btn-ghost mt-2 block text-sm">
        ← Change email or password
      </button>
    </>
  );
}

function SignupContent() {
  const search = useSearchParams();
  const role = (search.get("role") ?? "student").toLowerCase();
  const isStudent = role === "student";

  if (!isStudent) {
    return (
      <>
        <h1 className="page-title">Sign up as {role === "counselor" ? "counselor" : "specialist / alumni"}</h1>
        <p className="page-subtitle mt-2">
          For the private beta we are onboarding <strong>students</strong> first with email verification and Google. Counselor and specialist accounts will follow in a later release.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/auth/signup?role=student" className="btn-primary">
            Sign up as student
          </Link>
          <Link href="/auth/login?role=student" className="btn-secondary">
            Student login
          </Link>
        </div>
      </>
    );
  }

  return <StudentSignupWizard />;
}

export default function SignupPage() {
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
      <div className="h-full overflow-y-auto">
        <div className="page-wrap max-w-2xl py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="btn-ghost text-sm">
              ← Back
            </Link>
            <Link href="/auth/login?role=student" className="btn-secondary text-sm">
              Already have an account? Log in
            </Link>
          </div>
          <section className="panel p-6 sm:p-8">
            <SignupContent />
          </section>
        </div>
      </div>
    </React.Suspense>
  );
}
