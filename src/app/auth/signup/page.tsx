"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type StudentSignup = {
  fullName: string;
  schoolName: string;
  grade: "9" | "10" | "11" | "12" | "";
  location: string;
  interests: string;
  intendedMajors: string;
  usePurpose: string;
};

type SpecialistSignup = {
  fullName: string;
  roleType: "specialist" | "alumni";
  headline: string;
  bio: string;
  expertise: string;
  priceDisplay: string;
};

const emptyStudent: StudentSignup = {
  fullName: "",
  schoolName: "",
  grade: "",
  location: "",
  interests: "",
  intendedMajors: "",
  usePurpose: "",
};

const emptySpecialist: SpecialistSignup = {
  fullName: "",
  roleType: "specialist",
  headline: "",
  bio: "",
  expertise: "",
  priceDisplay: "$79 per featured placement",
};

function graduationYearFromGrade(grade: StudentSignup["grade"]): number | undefined {
  if (!grade) return undefined;
  const now = new Date();
  const currentYear = now.getFullYear();
  const seniorClassYear = now.getMonth() >= 7 ? currentYear + 1 : currentYear;
  const g = Number(grade);
  // 12 -> 0, 11 -> +1, etc.
  return seniorClassYear + (12 - g);
}

export default function SignupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const role = (search.get("role") ?? "student").toLowerCase();
  const isStudent = role === "student";
  const isCounselor = role === "counselor";
  const isSpecialist = role === "specialist";

  const [student, setStudent] = React.useState<StudentSignup>(emptyStudent);
  const [specialist, setSpecialist] = React.useState<SpecialistSignup>(emptySpecialist);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submitStudent() {
    setError(null);
    if (!student.fullName.trim() || !student.schoolName.trim() || !student.grade || !student.interests.trim() || !student.usePurpose.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: student.fullName.trim(),
        schoolName: student.schoolName.trim(),
        graduationYear: graduationYearFromGrade(student.grade),
        location: student.location.trim() || undefined,
        interests: student.interests.trim(),
        intendedMajors: student.intendedMajors.trim() || "",
        notes: `Platform use purpose: ${student.usePurpose.trim()}`,
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save profile.");
      router.push("/dashboard");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function submitSpecialist() {
    setError(null);
    if (!specialist.fullName.trim() || !specialist.headline.trim() || !specialist.bio.trim() || !specialist.expertise.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: specialist.fullName.trim(),
          roleType: specialist.roleType,
          headline: specialist.headline.trim(),
          bio: specialist.bio.trim(),
          expertise: specialist.expertise.trim(),
          priceDisplay: specialist.priceDisplay.trim() || "$79 per featured placement",
        }),
      });
      if (!res.ok) throw new Error("Failed to create specialist profile.");
      const data = (await res.json()) as { specialist: SpecialistSignup & { id: string } };
      localStorage.setItem("activeSpecialist:v1", JSON.stringify(data.specialist));
      router.push("/specialist");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-3xl py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="btn-ghost text-sm">← Back</Link>
          <Link href={`/auth/login?role=${isStudent ? "student" : "counselor"}`} className="btn-secondary text-sm">Already have an account? Login</Link>
        </div>

        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Sign up {isStudent ? "as Student" : isCounselor ? "as Counselor" : "as Specialist/Alumni"}</h1>
          <p className="page-subtitle mt-1">
            {isStudent
              ? "Students must complete profile setup before entering the workspace."
              : isCounselor
                ? "Counselor onboarding can be expanded with institution/team details next."
                : "Create your specialist marketplace profile."}
          </p>

          {isStudent ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Full name *</label>
                <input className="input-base" value={student.fullName} onChange={(e) => setStudent((s) => ({ ...s, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">School *</label>
                <input className="input-base" value={student.schoolName} onChange={(e) => setStudent((s) => ({ ...s, schoolName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Grade *</label>
                <select className="input-base" value={student.grade} onChange={(e) => setStudent((s) => ({ ...s, grade: e.target.value as StudentSignup["grade"] }))}>
                  <option value="">Select grade</option>
                  <option value="9">Freshman (9)</option>
                  <option value="10">Sophomore (10)</option>
                  <option value="11">Junior (11)</option>
                  <option value="12">Senior (12)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Location</label>
                <input className="input-base" value={student.location} onChange={(e) => setStudent((s) => ({ ...s, location: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Interests *</label>
                <textarea className="input-base h-24 resize-y" value={student.interests} onChange={(e) => setStudent((s) => ({ ...s, interests: e.target.value }))} placeholder="What subjects, problems, or activities excite you?" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Intended majors</label>
                <input className="input-base" value={student.intendedMajors} onChange={(e) => setStudent((s) => ({ ...s, intendedMajors: e.target.value }))} placeholder="e.g., Computer Science, Biology" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">What do you want to use this platform for? *</label>
                <textarea className="input-base h-24 resize-y" value={student.usePurpose} onChange={(e) => setStudent((s) => ({ ...s, usePurpose: e.target.value }))} placeholder="e.g., build a stronger 4-year profile, improve essays, track scholarship strategy..." />
              </div>
            </div>
          ) : isCounselor ? (
            <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Counselor sign up is currently a lightweight path. Continue to the dashboard now; team/institution onboarding can be added next.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Full name *</label>
                <input className="input-base" value={specialist.fullName} onChange={(e) => setSpecialist((s) => ({ ...s, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Profile type *</label>
                <select className="input-base" value={specialist.roleType} onChange={(e) => setSpecialist((s) => ({ ...s, roleType: e.target.value as SpecialistSignup["roleType"] }))}>
                  <option value="specialist">Specialist</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="field-label">Advertisement price text</label>
                <input className="input-base" value={specialist.priceDisplay} onChange={(e) => setSpecialist((s) => ({ ...s, priceDisplay: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Headline *</label>
                <input className="input-base" value={specialist.headline} onChange={(e) => setSpecialist((s) => ({ ...s, headline: e.target.value }))} placeholder="ex: MIT CS Alumni | Startup mentor" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Expertise *</label>
                <input className="input-base" value={specialist.expertise} onChange={(e) => setSpecialist((s) => ({ ...s, expertise: e.target.value }))} placeholder="ex: essays, STEM research, pitch decks" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Bio *</label>
                <textarea className="input-base h-24 resize-y" value={specialist.bio} onChange={(e) => setSpecialist((s) => ({ ...s, bio: e.target.value }))} />
              </div>
            </div>
          )}

          {error ? (
            <div className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <Link href="/" className="btn-secondary">Cancel</Link>
            <button
              type="button"
              onClick={() => void (isStudent ? submitStudent() : isCounselor ? router.push("/counselor") : submitSpecialist())}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? "Saving..." : isStudent ? "Complete sign up" : isCounselor ? "Continue" : "Create profile"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

