"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const search = useSearchParams();
  const role = (search.get("role") ?? "student").toLowerCase();
  const destination = role === "counselor" ? "/counselor" : role === "specialist" ? "/specialist" : "/dashboard";
  const roleLabel = role === "counselor" ? "Counselor" : role === "specialist" ? "Specialist/Alumni" : "Student";

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-2xl py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="btn-ghost text-sm">← Back</Link>
          <Link href={`/auth/signup?role=${role}`} className="btn-secondary text-sm">Need an account? Sign up</Link>
        </div>

        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Login as {roleLabel}</h1>
          <p className="page-subtitle mt-1">
            Authentication UI is staged. For now, continue to the workspace.
          </p>
          <div className="mt-6">
            <Link href={destination} className="btn-primary">
              Continue to {role === "counselor" ? "counselor home" : role === "specialist" ? "specialist home" : "dashboard"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

