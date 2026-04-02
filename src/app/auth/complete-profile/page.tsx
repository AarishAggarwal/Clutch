"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Grade = "9" | "10" | "11" | "12" | "";

function graduationYearFromGrade(grade: Grade): number | undefined {
  if (!grade) return undefined;
  const now = new Date();
  const currentYear = now.getFullYear();
  const seniorClassYear = now.getMonth() >= 7 ? currentYear + 1 : currentYear;
  const g = Number(grade);
  return seniorClassYear + (12 - g);
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { status } = useSession();
  const [fullName, setFullName] = React.useState("");
  const [schoolName, setSchoolName] = React.useState("");
  const [grade, setGrade] = React.useState<Grade>("");
  const [location, setLocation] = React.useState("");
  const [interests, setInterests] = React.useState("");
  const [intendedMajors, setIntendedMajors] = React.useState("");
  const [usePurpose, setUsePurpose] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?role=student&callbackUrl=/auth/complete-profile");
    }
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = (await res.json()) as { profile: Record<string, unknown> };
      const p = data.profile;
      if (typeof p.fullName === "string") setFullName(p.fullName);
      if (typeof p.schoolName === "string") setSchoolName(p.schoolName);
      if (typeof p.location === "string") setLocation(p.location);
      if (typeof p.interests === "string") setInterests(p.interests);
      if (typeof p.intendedMajors === "string") setIntendedMajors(p.intendedMajors);
    })();
  }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !schoolName.trim() || !grade || !interests.trim() || !usePurpose.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          schoolName: schoolName.trim(),
          graduationYear: graduationYearFromGrade(grade),
          location: location.trim() || undefined,
          interests: interests.trim(),
          intendedMajors: intendedMajors.trim() || "",
          notes: `Platform use purpose: ${usePurpose.trim()}`,
        }),
      });
      if (!res.ok) throw new Error("Could not save profile.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="page-wrap max-w-3xl py-10">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-3xl py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="btn-ghost text-sm">
            Skip for now
          </Link>
        </div>
        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Finish your profile</h1>
          <p className="page-subtitle mt-1">Tell us a bit about you so the workspace can personalize your experience.</p>

          {error ? (
            <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">Full name *</label>
              <input className="input-base w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">School *</label>
              <input className="input-base w-full" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Grade *</label>
              <select
                className="input-base w-full"
                value={grade}
                onChange={(e) => setGrade(e.target.value as Grade)}
                required
              >
                <option value="">Select grade</option>
                <option value="9">Freshman (9)</option>
                <option value="10">Sophomore (10)</option>
                <option value="11">Junior (11)</option>
                <option value="12">Senior (12)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Location</label>
              <input className="input-base w-full" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Interests *</label>
              <textarea
                className="input-base h-24 w-full resize-y"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="What subjects, problems, or activities excite you?"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Intended majors</label>
              <input
                className="input-base w-full"
                value={intendedMajors}
                onChange={(e) => setIntendedMajors(e.target.value)}
                placeholder="e.g., Computer Science, Biology"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">What do you want to use this platform for? *</label>
              <textarea
                className="input-base h-24 w-full resize-y"
                value={usePurpose}
                onChange={(e) => setUsePurpose(e.target.value)}
                placeholder="e.g., essays, college list, scholarships…"
                required
              />
            </div>
            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? "Saving…" : "Save and go to dashboard"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
