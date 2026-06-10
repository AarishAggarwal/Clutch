"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CounselorStatCard from "@/components/counselor/CounselorStatCard";
import StudentStatusBadge from "@/components/counselor/StudentStatusBadge";

type DashboardData = {
  stats: {
    totalStudents: number;
    essaysPendingReview: number;
    applicationsSubmitted: number;
    maxStudents: number;
  };
  studentsNeedingAttention: Array<{
    studentId: string;
    fullName: string | null;
    schoolName: string | null;
    readiness: number;
    status: string;
    pendingReview: number;
  }>;
  essayReviewQueue: Array<{
    id: string;
    title: string;
    essayType: string;
    wordCount: number;
    updatedAt: string;
    userId: string;
  }>;
  connectRequests: Array<{
    requestId: string;
    studentName: string;
    studentId: string;
    specialistName: string;
    createdAt: string;
  }>;
  onboardingComplete: boolean;
};

export default function CounselorDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/counselor/dashboard");
      if (!res.ok) {
        setError("Could not load dashboard.");
        return;
      }
      const payload = (await res.json()) as DashboardData;
      setData(payload);
      if (!payload.onboardingComplete) {
        router.replace("/counselor/onboarding");
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div className="page-wrap py-10">
        <p style={{ color: "var(--danger)" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrap py-10">
        <p className="section-meta">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Counselor Dashboard</h1>
            <p className="page-subtitle">Overview of your student roster, essay reviews, and connect requests.</p>
          </div>
          <Link href="/counselor/students/add" className="btn-primary text-sm">
            + Add student by code
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <CounselorStatCard label="Total students" value={data.stats.totalStudents} hint={`of ${data.stats.maxStudents} max`} />
          <CounselorStatCard label="Essays pending review" value={data.stats.essaysPendingReview} />
          <CounselorStatCard label="Applications submitted" value={data.stats.applicationsSubmitted} />
          <CounselorStatCard label="Roster capacity" value={`${data.stats.totalStudents}/${data.stats.maxStudents}`} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="panel p-4">
            <div className="section-heading">Students needing attention</div>
            <div className="mt-3 space-y-2">
              {data.studentsNeedingAttention.map((s) => (
                <Link
                  key={s.studentId}
                  href={`/counselor/students/${encodeURIComponent(s.studentId)}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:bg-[var(--bg-muted)]"
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  <div>
                    <div style={{ color: "var(--text-primary)" }}>{s.fullName || "Unnamed student"}</div>
                    <div className="section-meta">{s.schoolName || "No school"} · {s.studentId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{s.readiness}%</span>
                    <StudentStatusBadge status={s.status} />
                  </div>
                </Link>
              ))}
              {!data.studentsNeedingAttention.length ? (
                <p className="section-meta">No students on your roster yet. Add a student by their ID code.</p>
              ) : null}
            </div>
          </section>

          <section className="panel p-4">
            <div className="section-heading">Essay review queue</div>
            <div className="mt-3 space-y-2">
              {data.essayReviewQueue.map((e) => (
                <div key={e.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                  <div style={{ color: "var(--text-primary)" }}>{e.title}</div>
                  <div className="section-meta">
                    {e.essayType} · {e.wordCount} words · {new Date(e.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {!data.essayReviewQueue.length ? (
                <p className="section-meta">No essays awaiting review.</p>
              ) : null}
            </div>
          </section>
        </div>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Marketplace connect requests</div>
          <div className="mt-3 space-y-2">
            {data.connectRequests.map((r) => (
              <div key={r.requestId} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                <div style={{ color: "var(--text-primary)" }}>
                  {r.studentName} ({r.studentId}) wants to meet {r.specialistName}
                </div>
                <div className="section-meta">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!data.connectRequests.length ? <p className="section-meta">No connect requests from your roster.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
