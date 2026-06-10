"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Preview = {
  fullName?: string | null;
  schoolName?: string | null;
  graduationYear?: number | null;
  location?: string | null;
  intendedMajors?: string | null;
};

export default function AddStudentPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [studentId, setStudentId] = React.useState<string | null>(null);
  const [alreadyOnRoster, setAlreadyOnRoster] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [linking, setLinking] = React.useState(false);

  async function lookup() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/counselor/roster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        preview?: Preview;
        studentId?: string;
        alreadyOnRoster?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Student not found.");
        return;
      }
      setPreview(data.preview ?? null);
      setStudentId(data.studentId ?? null);
      setAlreadyOnRoster(Boolean(data.alreadyOnRoster));
    } finally {
      setLoading(false);
    }
  }

  async function confirmAdd() {
    if (!studentId) return;
    setLinking(true);
    setError(null);
    try {
      const res = await fetch("/api/counselor/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "add" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add student.");
        return;
      }
      router.push(`/counselor/students/${encodeURIComponent(studentId)}`);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-2xl py-10">
        <div className="mb-6">
          <Link href="/counselor/students" className="btn-ghost text-sm">
            ← Back to roster
          </Link>
        </div>

        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Add student by code</h1>
          <p className="page-subtitle mt-1">
            Ask the student to share their ID from their profile page (format: STU-XXXXXXXX).
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="input-base font-mono uppercase"
              placeholder="STU-XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && void lookup()}
            />
            <button type="button" className="btn-primary" disabled={loading} onClick={() => void lookup()}>
              {loading ? "Looking up…" : "Look up"}
            </button>
          </div>

          {preview ? (
            <div className="panel-muted mt-6 p-4">
              <div className="section-heading">Student preview</div>
              <div className="mt-2 text-sm" style={{ color: "var(--text-primary)" }}>
                {preview.fullName || "Unnamed student"}
              </div>
              <div className="section-meta mt-1">
                {preview.schoolName || "No school"} · Class of {preview.graduationYear || "N/A"}
              </div>
              {preview.intendedMajors ? (
                <div className="section-meta mt-1">Intended majors: {preview.intendedMajors}</div>
              ) : null}
              {alreadyOnRoster ? (
                <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  This student is already on your roster.
                </p>
              ) : (
                <button
                  type="button"
                  className="btn-primary mt-4"
                  disabled={linking}
                  onClick={() => void confirmAdd()}
                >
                  {linking ? "Adding…" : "Confirm and add to roster"}
                </button>
              )}
              {studentId && alreadyOnRoster ? (
                <Link
                  href={`/counselor/students/${encodeURIComponent(studentId)}`}
                  className="btn-secondary mt-3 inline-block"
                >
                  View student
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
