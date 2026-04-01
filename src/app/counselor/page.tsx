"use client";

import * as React from "react";

type CounselorView = {
  studentId: string;
  profile: {
    fullName?: string | null;
    graduationYear?: number | null;
    schoolName?: string | null;
    gpa?: number | null;
    sat?: number | null;
    act?: number | null;
    intendedMajors?: string | null;
    interests?: string | null;
    courseworkSummary?: string | null;
    location?: string | null;
    notes?: string | null;
  };
  readiness: { essayScore: number; activityScore: number; gradesScore: number; overall: number };
  essays: Array<{ id: string; title: string; essayType: string; status: string; wordCount: number; updatedAt: string }>;
  activities: Array<{
    id: string;
    title: string;
    category: string;
    organization: string;
    role: string;
    grades: string;
    hoursPerWeek: number;
    weeksPerYear: number;
    description: string;
    achievementNotes?: string | null;
  }>;
  locker: Array<{ id: string; title: string; updatedAt: string }>;
};
type LockerPayload = {
  filename: string;
  mimeType: string;
  size: number;
  data: string;
  uploadedAt?: string;
};
type ConnectRequest = {
  requestId: string;
  specialistId: string;
  specialistName: string;
  studentId: string;
  studentName: string;
  createdAt: string;
};

export default function CounselorHomePage() {
  const [studentIdQuery, setStudentIdQuery] = React.useState("");
  const [roster, setRoster] = React.useState<string[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [view, setView] = React.useState<CounselorView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<{ fileName: string; payload: LockerPayload } | null>(null);
  const [connectRequests, setConnectRequests] = React.useState<ConnectRequest[]>([]);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/counselor/roster");
      if (!res.ok) return;
      const data = (await res.json()) as { studentIds: string[] };
      setRoster(data.studentIds ?? []);
      if (data.studentIds?.[0]) setSelectedId(data.studentIds[0]);
    })();
  }, []);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marketplace/connect");
      if (!res.ok) return;
      const data = (await res.json()) as { requests: ConnectRequest[] };
      setConnectRequests(data.requests ?? []);
    })();
  }, []);

  async function loadStudent(studentId: string) {
    if (!studentId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/counselor/student/${encodeURIComponent(studentId)}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Student not found.");
      }
      const data = (await res.json()) as CounselorView;
      setView(data);
      setSelectedId(studentId);
      if (!roster.includes(studentId)) {
        const up = await fetch("/api/counselor/roster", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ studentId, action: "add" }),
        });
        if (up.ok) {
          const rosterData = (await up.json()) as { studentIds: string[] };
          setRoster(rosterData.studentIds ?? []);
        }
      }
    } catch (err: any) {
      setView(null);
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  function addFromSearch() {
    const id = studentIdQuery.trim().toUpperCase();
    if (!id) return;
    void loadStudent(id);
  }

  async function removeFromRoster(id: string) {
    const res = await fetch("/api/counselor/roster", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId: id, action: "remove" }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { studentIds: string[] };
    setRoster(data.studentIds ?? []);
    if (selectedId === id) {
      setSelectedId("");
      setView(null);
    }
  }

  async function openLockerPreview(fileId: string, fileName: string) {
    const res = await fetch(`/api/locker/${fileId}/content`);
    if (!res.ok) return;
    const data = (await res.json()) as { payload: LockerPayload };
    setPreview({ fileName, payload: data.payload });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <h1 className="page-title">Counselor Home</h1>
          <p className="page-subtitle">Search by Student ID, add to your roster, and review each student’s admissions progress.</p>
        </div>

        <section className="panel p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="input-base"
              placeholder="Search by Student ID (e.g., STU-1A2B3C4D)"
              value={studentIdQuery}
              onChange={(e) => setStudentIdQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFromSearch()}
            />
            <button className="btn-primary" onClick={addFromSearch}>
              Search + Add
            </button>
            <select className="input-base min-w-[14rem]" value={selectedId} onChange={(e) => void loadStudent(e.target.value)}>
              <option value="">Select saved student</option>
              {roster.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          {selectedId ? (
            <div className="mt-2">
              <button className="btn-ghost text-xs px-2.5 py-1.5" onClick={() => void removeFromRoster(selectedId)}>
                Remove selected from roster
              </button>
            </div>
          ) : null}
          {error ? <div className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{error}</div> : null}
        </section>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Marketplace Connect Requests</div>
          <div className="section-meta mt-1">Students who clicked connect with alumni/specialists.</div>
          <div className="mt-3 space-y-2">
            {connectRequests.map((r) => (
              <div key={r.requestId} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                <div style={{ color: "var(--text-primary)" }}>
                  {r.studentName} ({r.studentId}) wants to meet {r.specialistName}
                </div>
                <div className="section-meta">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!connectRequests.length ? <div className="section-meta">No connect requests yet.</div> : null}
          </div>
        </section>

        {loading ? <div className="section-meta mt-4">Loading student...</div> : null}

        {view ? (
          <div className="mt-4 space-y-4">
            <section className="panel p-4">
              <div className="section-heading">Student Overview · {view.studentId}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <Stat title="Readiness" value={`${view.readiness.overall}%`} />
                <Stat title="Essays" value={`${view.readiness.essayScore}%`} />
                <Stat title="Activities" value={`${view.readiness.activityScore}%`} />
                <Stat title="Grades" value={`${view.readiness.gradesScore}%`} />
              </div>
              <div className="mt-3 section-meta">
                {view.profile.fullName || "Unnamed student"} · {view.profile.schoolName || "No school"} · Class of{" "}
                {view.profile.graduationYear || "N/A"} · GPA {view.profile.gpa ?? "N/A"} · SAT {view.profile.sat ?? "N/A"} · ACT{" "}
                {view.profile.act ?? "N/A"}
              </div>
            </section>

            <section className="panel p-4">
              <div className="section-heading">Saved Essays</div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead style={{ color: "var(--text-muted)" }}>
                    <tr>
                      <th className="pb-2">Title</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Words</th>
                      <th className="pb-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.essays.map((e) => (
                      <tr key={e.id} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                        <td className="py-2">{e.title}</td>
                        <td className="py-2">{e.essayType}</td>
                        <td className="py-2">{e.status}</td>
                        <td className="py-2">{e.wordCount}</td>
                        <td className="py-2">{new Date(e.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {!view.essays.length ? (
                      <tr><td className="py-3 section-meta" colSpan={5}>No essays saved.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel p-4">
              <div className="section-heading">Activities (Common App style)</div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead style={{ color: "var(--text-muted)" }}>
                    <tr>
                      <th className="pb-2">Activity</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Organization</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Grades</th>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.activities.map((a) => (
                      <tr key={a.id} className="border-t align-top" style={{ borderColor: "var(--border-soft)" }}>
                        <td className="py-2">{a.title}<div className="section-meta mt-1">{a.description}</div></td>
                        <td className="py-2">{a.category}</td>
                        <td className="py-2">{a.organization}</td>
                        <td className="py-2">{a.role}</td>
                        <td className="py-2">{a.grades}</td>
                        <td className="py-2">{a.hoursPerWeek}h/wk · {a.weeksPerYear}wk/yr</td>
                        <td className="py-2">{a.achievementNotes || "-"}</td>
                      </tr>
                    ))}
                    {!view.activities.length ? (
                      <tr><td className="py-3 section-meta" colSpan={7}>No activities saved.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel p-4">
              <div className="section-heading">Grades + Academic Context</div>
              <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Intended majors: {view.profile.intendedMajors || "N/A"}
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Interests: {view.profile.interests || "N/A"}
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Coursework summary: {view.profile.courseworkSummary || "N/A"}
              </div>
            </section>

            <section className="panel p-4">
              <div className="section-heading">Locker</div>
              <div className="mt-2 space-y-2">
                {view.locker.map((f) => (
                  <div key={f.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                    {f.title}
                    <div className="section-meta">{new Date(f.updatedAt).toLocaleDateString()}</div>
                    <button
                      className="btn-secondary mt-2 text-xs px-2.5 py-1.5"
                      onClick={() => void openLockerPreview(f.id, f.title)}
                    >
                      Preview
                    </button>
                  </div>
                ))}
                {!view.locker.length ? <div className="section-meta">No locker files uploaded.</div> : null}
              </div>
            </section>

            {preview ? (
              <section className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="section-heading">Locker Preview · {preview.fileName}</div>
                  <button className="btn-ghost text-xs" onClick={() => setPreview(null)}>Close</button>
                </div>
                {preview.payload.mimeType.startsWith("image/") ? (
                  <img
                    src={`data:${preview.payload.mimeType};base64,${preview.payload.data}`}
                    alt={preview.fileName}
                    className="max-h-[30rem] rounded-lg border"
                    style={{ borderColor: "var(--border-soft)" }}
                  />
                ) : preview.payload.mimeType === "application/pdf" ? (
                  <iframe
                    title={preview.fileName}
                    src={`data:${preview.payload.mimeType};base64,${preview.payload.data}`}
                    className="h-[38rem] w-full rounded-lg border"
                    style={{ borderColor: "var(--border-soft)" }}
                  />
                ) : (
                  <div className="section-meta">Preview not available for this file type.</div>
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="panel-muted p-3">
      <div className="section-meta">{title}</div>
      <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

