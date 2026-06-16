"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CounselorStatCard from "@/components/counselor/CounselorStatCard";

type StudentView = {
  studentId: string;
  profile: {
    fullName?: string | null;
    schoolName?: string | null;
    graduationYear?: number | null;
    gpa?: number | null;
    sat?: number | null;
    act?: number | null;
    intendedMajors?: string | null;
    interests?: string | null;
    courseworkSummary?: string | null;
    location?: string | null;
  };
  readiness: { essayScore: number; activityScore: number; gradesScore: number; overall: number };
  essays: Array<{
    id: string;
    title: string;
    essayType: string;
    status: string;
    wordCount: number;
    content: string;
    updatedAt: string;
  }>;
  activities: Array<{
    id: string;
    title: string;
    category: string;
    organization: string;
    role: string;
    description: string;
    hoursPerWeek: number;
    weeksPerYear: number;
  }>;
  locker: Array<{ id: string; title: string; updatedAt: string }>;
  aiSummary: {
    academic_overview?: string;
    extracurricular_overview?: string;
    strengths?: string[];
    weaknesses?: string[];
    college_readiness?: string;
    recommended_next_steps?: string[];
    executive_summary?: string;
    ec_narrative?: string;
    essay_readiness?: string;
    top_strengths?: string[];
    priority_actions?: string[];
    generatedAt?: string;
  } | null;
};

type Note = {
  id: string;
  content: string;
  sessionDate?: string | null;
  topics?: string | null;
  createdAt: string;
};

type Feedback = {
  id: string;
  targetType: "essay" | "activity";
  targetId: string;
  content: string;
  createdAt: string;
};

export default function CounselorStudentDetailPage() {
  const params = useParams();
  const studentId = String(params.studentId ?? "");
  const [view, setView] = React.useState<StudentView | null>(null);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [noteText, setNoteText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [expandedEssay, setExpandedEssay] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [essayEdits, setEssayEdits] = React.useState<Record<string, string>>({});
  const [essaySaving, setEssaySaving] = React.useState<string | null>(null);
  const [essayCommentDrafts, setEssayCommentDrafts] = React.useState<Record<string, string>>({});
  const [activityCommentDrafts, setActivityCommentDrafts] = React.useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    const [studentRes, notesRes, feedbackRes] = await Promise.all([
      fetch(`/api/counselor/student/${encodeURIComponent(studentId)}`),
      fetch(`/api/counselor/notes/${encodeURIComponent(studentId)}`),
      fetch(`/api/counselor/feedback/${encodeURIComponent(studentId)}`),
    ]);
    if (!studentRes.ok) {
      const data = (await studentRes.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not load student.");
      setView(null);
    } else {
      setView((await studentRes.json()) as StudentView);
    }
    if (notesRes.ok) {
      const data = (await notesRes.json()) as { notes: Note[] };
      setNotes(data.notes ?? []);
    }
    if (feedbackRes.ok) {
      const data = (await feedbackRes.json()) as { feedback: Feedback[] };
      setFeedback(data.feedback ?? []);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, [studentId]);

  async function generateSummary() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/counselor/ai/portfolio-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not generate summary.");
        return;
      }
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`/api/counselor/notes/${encodeURIComponent(studentId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText.trim() }),
    });
    if (res.ok) {
      setNoteText("");
      const data = (await res.json()) as { note: Note };
      setNotes((prev) => [data.note, ...prev]);
    }
  }

  async function saveEssayEdit(essay: StudentView["essays"][0]) {
    const content = (essayEdits[essay.id] ?? essay.content).trim();
    if (!content) return;
    setEssaySaving(essay.id);
    const res = await fetch(`/api/essays/${essay.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: essay.title,
        essayType: essay.essayType,
        content,
        plainText: content,
        status: essay.status,
        draft: 1,
        authorRole: "counselor",
      }),
    });
    setEssaySaving(null);
    if (res.ok) await load();
  }

  async function submitComment(targetType: "essay" | "activity", targetId: string) {
    const value = (targetType === "essay" ? essayCommentDrafts[targetId] : activityCommentDrafts[targetId])?.trim();
    if (!value) return;
    const res = await fetch(`/api/counselor/feedback/${encodeURIComponent(studentId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, content: value }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { feedback: Feedback };
    setFeedback((prev) => [data.feedback, ...prev]);
    if (targetType === "essay") {
      setEssayCommentDrafts((prev) => ({ ...prev, [targetId]: "" }));
    } else {
      setActivityCommentDrafts((prev) => ({ ...prev, [targetId]: "" }));
    }
  }

  function commentsFor(targetType: "essay" | "activity", targetId: string) {
    return feedback.filter((f) => f.targetType === targetType && f.targetId === targetId);
  }

  if (loading) {
    return (
      <div className="page-wrap py-10">
        <p className="section-meta">Loading student…</p>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="page-wrap py-10">
        <p style={{ color: "var(--danger)" }}>{error ?? "Student not found."}</p>
        <Link href="/counselor/students" className="btn-secondary mt-4 inline-block text-sm">
          Back to roster
        </Link>
      </div>
    );
  }

  const summary = view.aiSummary;

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <Link href="/counselor/students" className="btn-ghost text-sm">
            ← Back to roster
          </Link>
          <h1 className="page-title mt-3">{view.profile.fullName || "Unnamed student"}</h1>
          <p className="page-subtitle">
            {view.profile.schoolName || "No school"} · {view.studentId} · Class of {view.profile.graduationYear || "N/A"}
          </p>
        </div>

        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-heading">AI portfolio summary</div>
              <div className="section-meta mt-1">
                {summary?.generatedAt
                  ? `Last generated ${new Date(summary.generatedAt).toLocaleString()}`
                  : "Not generated yet"}
                {" · "}
                <span className="text-xs">Generated by AI</span>
              </div>
            </div>
            <button type="button" className="btn-primary text-sm" disabled={generating} onClick={() => void generateSummary()}>
              {generating ? "Generating…" : summary ? "Regenerate summary" : "Generate AI summary"}
            </button>
          </div>

          {(summary?.academic_overview || summary?.executive_summary) ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {summary.academic_overview ?? summary.executive_summary}
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel-muted p-3">
                  <div className="section-heading text-xs">Extracurricular overview</div>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {summary.extracurricular_overview ?? summary.ec_narrative ?? "—"}
                  </p>
                </div>
                <div className="panel-muted p-3">
                  <div className="section-heading text-xs">College readiness</div>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {summary.college_readiness ?? summary.essay_readiness ?? "—"}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel-muted p-3">
                  <div className="section-heading text-xs">Strengths</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {(summary.strengths ?? summary.top_strengths ?? []).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="panel-muted p-3">
                  <div className="section-heading text-xs">Weaknesses</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {(summary.weaknesses ?? []).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="panel-muted p-3">
                <div className="section-heading text-xs">Recommended next steps</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {(summary.recommended_next_steps ?? summary.priority_actions ?? []).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="section-meta mt-4">Generate a summary to get an AI-powered overview of this student&apos;s portfolio.</p>
          )}
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <CounselorStatCard label="Readiness" value={`${view.readiness.overall}%`} />
          <CounselorStatCard label="Essays" value={`${view.readiness.essayScore}%`} />
          <CounselorStatCard label="Activities" value={`${view.readiness.activityScore}%`} />
          <CounselorStatCard label="Grades" value={`${view.readiness.gradesScore}%`} />
        </div>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Profile overview</div>
          <div className="mt-2 section-meta">
            GPA {view.profile.gpa ?? "N/A"} · SAT {view.profile.sat ?? "N/A"} · ACT {view.profile.act ?? "N/A"}
          </div>
          <div className="mt-1 section-meta">Majors: {view.profile.intendedMajors || "N/A"}</div>
          <div className="mt-1 section-meta">Interests: {view.profile.interests || "N/A"}</div>
        </section>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Essays</div>
          <div className="mt-3 space-y-2">
            {view.essays.map((e) => (
              <div key={e.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-soft)" }}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-sm"
                  onClick={() => setExpandedEssay(expandedEssay === e.id ? null : e.id)}
                >
                  <span style={{ color: "var(--text-primary)" }}>{e.title}</span>
                  <span className="section-meta">
                    {e.status} · {e.wordCount} words
                  </span>
                </button>
                {expandedEssay === e.id ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="section-heading text-xs">Edit essay (saved with version history)</div>
                      <textarea
                        className="input-base mt-2 min-h-[10rem] w-full resize-y text-sm leading-relaxed"
                        value={essayEdits[e.id] ?? e.content}
                        onChange={(ev) => setEssayEdits((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn-primary mt-2 text-xs"
                        disabled={essaySaving === e.id}
                        onClick={() => void saveEssayEdit(e)}
                      >
                        {essaySaving === e.id ? "Saving…" : "Save edits"}
                      </button>
                    </div>
                    <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                      <div className="section-heading text-xs">Student-visible counselor comments</div>
                      <div className="mt-2 space-y-2">
                        {commentsFor("essay", e.id).map((c) => (
                          <div key={c.id} className="rounded border px-2 py-2 text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
                            {c.content}
                          </div>
                        ))}
                        {!commentsFor("essay", e.id).length ? <div className="section-meta">No comments yet.</div> : null}
                      </div>
                      <textarea
                        className="input-base mt-2 h-20 w-full resize-y text-sm"
                        placeholder="Add comment visible to student..."
                        value={essayCommentDrafts[e.id] ?? ""}
                        onChange={(ev) => setEssayCommentDrafts((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                      />
                      <button type="button" className="btn-secondary mt-2 text-xs" onClick={() => void submitComment("essay", e.id)}>
                        Post comment
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {!view.essays.length ? <p className="section-meta">No essays saved.</p> : null}
          </div>
        </section>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Activities</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead style={{ color: "var(--text-muted)" }}>
                <tr>
                  <th className="pb-2">Activity</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {view.activities.map((a) => (
                  <tr key={a.id} className="border-t align-top" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="py-2">
                      {a.title}
                      <div className="section-meta mt-1">{a.description}</div>
                      <div className="mt-2 space-y-1">
                        {commentsFor("activity", a.id).slice(0, 2).map((c) => (
                          <div key={c.id} className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
                            {c.content}
                          </div>
                        ))}
                      </div>
                      <textarea
                        className="input-base mt-2 h-16 w-full resize-y text-xs"
                        placeholder="Add activity comment visible to student..."
                        value={activityCommentDrafts[a.id] ?? ""}
                        onChange={(ev) => setActivityCommentDrafts((prev) => ({ ...prev, [a.id]: ev.target.value }))}
                      />
                      <button type="button" className="btn-secondary mt-2 text-xs" onClick={() => void submitComment("activity", a.id)}>
                        Post comment
                      </button>
                    </td>
                    <td className="py-2">{a.category}</td>
                    <td className="py-2">{a.role}</td>
                    <td className="py-2">
                      {a.hoursPerWeek}h/wk · {a.weeksPerYear}wk/yr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel mt-4 p-4">
          <div className="section-heading">Private notes & session log</div>
          <form onSubmit={saveNote} className="mt-3 grid gap-2">
            <textarea
              className="input-base h-24 w-full resize-y"
              placeholder="Add a private note (not visible to student)…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button type="submit" className="btn-secondary w-fit text-sm">
              Save note
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                <div style={{ color: "var(--text-primary)" }}>{n.content}</div>
                <div className="section-meta mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!notes.length ? <p className="section-meta">No notes yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
