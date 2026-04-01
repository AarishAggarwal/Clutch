"use client";

import * as React from "react";

type Profile = {
  studentId?: string;
  fullName?: string | null;
  graduationYear?: number | null;
  schoolName?: string | null;
  gpa?: number | null;
  sat?: number | null;
  act?: number | null;
  intendedMajors: string;
  courseworkSummary?: string | null;
  location?: string | null;
  interests: string;
  notes?: string | null;
};

const empty: Profile = { intendedMajors: "", interests: "" };

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile>(empty);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profile");
      const data = (await res.json()) as { profile: Profile; studentId?: string };
      setProfile({ ...data.profile, studentId: data.studentId });
    })();
  }, []);

  async function save() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        graduationYear: profile.graduationYear ? Number(profile.graduationYear) : undefined,
        gpa: profile.gpa ? Number(profile.gpa) : undefined,
        sat: profile.sat ? Number(profile.sat) : undefined,
        act: profile.act ? Number(profile.act) : undefined,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Student profile</h1>
            <p className="page-subtitle">Core academic facts that power your dashboard readiness score and essay context.</p>
            {profile.studentId ? (
              <p className="section-meta mt-1">
                Student ID: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{profile.studentId}</span>
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {saved ? <span className="badge-accent text-xs">Saved</span> : null}
            <button type="button" onClick={() => void save()} className="btn-primary">
              Save profile
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Identity & school
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Full name</label>
                <input
                  className="input-base"
                  placeholder="Legal name"
                  value={profile.fullName ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">School</label>
                <input
                  className="input-base"
                  value={profile.schoolName ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, schoolName: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">Graduation year</label>
                <input
                  type="number"
                  className="input-base"
                  value={profile.graduationYear ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, graduationYear: Number(e.target.value) || null }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Location</label>
                <input
                  className="input-base"
                  value={profile.location ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, location: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Academic signal
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">GPA (u.w.)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-base"
                  value={profile.gpa ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, gpa: Number(e.target.value) || null }))}
                />
              </div>
              <div>
                <label className="field-label">SAT</label>
                <input
                  type="number"
                  className="input-base"
                  value={profile.sat ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, sat: Number(e.target.value) || null }))}
                />
              </div>
              <div>
                <label className="field-label">ACT</label>
                <input
                  type="number"
                  className="input-base"
                  value={profile.act ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, act: Number(e.target.value) || null }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="field-label">Intended majors</label>
              <input
                className="input-base"
                placeholder="Comma-separated"
                value={profile.intendedMajors ?? ""}
                onChange={(e) => setProfile((s) => ({ ...s, intendedMajors: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <label className="field-label">Course rigor summary</label>
              <textarea
                className="input-base h-24 resize-y leading-relaxed"
                value={profile.courseworkSummary ?? ""}
                onChange={(e) => setProfile((s) => ({ ...s, courseworkSummary: e.target.value }))}
              />
            </div>
          </section>

          <section className="panel p-5 lg:col-span-2">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Narrative context
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Interests & spikes</label>
                <textarea
                  className="input-base min-h-[7rem] resize-y leading-relaxed"
                  value={profile.interests ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, interests: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">Counselor / strategy notes</label>
                <textarea
                  className="input-base min-h-[7rem] resize-y leading-relaxed"
                  value={profile.notes ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>
            </div>
            <p className="section-meta mt-4">Stored locally—align with essays and activities for a coherent application story.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
