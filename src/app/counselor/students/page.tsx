"use client";

import * as React from "react";
import Link from "next/link";
import StudentStatusBadge from "@/components/counselor/StudentStatusBadge";

type RosterStudent = {
  studentId: string;
  profile: {
    fullName?: string | null;
    schoolName?: string | null;
    graduationYear?: number | null;
    gpa?: number | null;
  };
  readiness: { overall: number };
  status: string;
  linkedAt: string;
};

export default function CounselorStudentsPage() {
  const [students, setStudents] = React.useState<RosterStudent[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/counselor/roster");
      if (res.ok) {
        const data = (await res.json()) as { students: RosterStudent[] };
        setStudents(data.students ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.studentId.toLowerCase().includes(q) ||
      (s.profile.fullName ?? "").toLowerCase().includes(q) ||
      (s.profile.schoolName ?? "").toLowerCase().includes(q)
    );
  });

  async function removeStudent(studentId: string) {
    const res = await fetch("/api/counselor/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, action: "remove" }),
    });
    if (!res.ok) return;
    setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Student roster</h1>
            <p className="page-subtitle">All students linked to your counselor account.</p>
          </div>
          <Link href="/counselor/students/add" className="btn-primary text-sm">
            + Add student
          </Link>
        </div>

        <section className="panel p-4">
          <input
            className="input-base w-full max-w-md"
            placeholder="Search by name, school, or student ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loading ? (
            <p className="section-meta mt-4">Loading roster…</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead style={{ color: "var(--text-muted)" }}>
                  <tr>
                    <th className="pb-2">Student</th>
                    <th className="pb-2">School</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Readiness</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Linked</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.studentId} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                      <td className="py-3">
                        <Link
                          href={`/counselor/students/${encodeURIComponent(s.studentId)}`}
                          className="font-medium hover:underline"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {s.profile.fullName || "Unnamed"}
                        </Link>
                        <div className="section-meta font-mono text-xs">{s.studentId}</div>
                      </td>
                      <td className="py-3">{s.profile.schoolName || "—"}</td>
                      <td className="py-3">{s.profile.graduationYear ? `Class of ${s.profile.graduationYear}` : "—"}</td>
                      <td className="py-3 font-mono">{s.readiness.overall}%</td>
                      <td className="py-3">
                        <StudentStatusBadge status={s.status} />
                      </td>
                      <td className="py-3 section-meta">{new Date(s.linkedAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => void removeStudent(s.studentId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={7} className="py-6 section-meta">
                        No students on your roster.{" "}
                        <Link href="/counselor/students/add" className="underline">
                          Add one by student ID
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
