"use client";

import * as React from "react";

type BoardSystem = "CBSE" | "ICSE" | "IB" | "AP" | null;

type AcademicData = Record<string, unknown>;

type Profile = {
  studentId?: string;
  fullName?: string | null;
  pronouns?: string | null;
  graduationYear?: number | null;
  schoolName?: string | null;
  gpa?: number | null;
  sat?: number | null;
  act?: number | null;
  boardSystem?: BoardSystem;
  academicData?: AcademicData | null;
  intendedMajors: string;
  courseworkSummary?: string | null;
  location?: string | null;
  interests: string;
  notes?: string | null;
};

const empty: Profile = { intendedMajors: "", interests: "", academicData: {} };

function satError(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  if (v < 400 || v > 1600) return "SAT must be between 400 and 1600.";
  return null;
}

function actError(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return null;
  if (v < 1 || v > 36) return "ACT must be between 1 and 36.";
  return null;
}

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile>(empty);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profile");
      const data = (await res.json()) as { profile: Profile; studentId?: string };
      setProfile({
        ...data.profile,
        studentId: data.studentId,
        academicData: data.profile.academicData ?? {},
        boardSystem: (data.profile.boardSystem as BoardSystem) ?? null,
      });
    })();
  }, []);

  function setAcademicField(key: string, value: unknown) {
    setProfile((s) => ({
      ...s,
      academicData: { ...(s.academicData ?? {}), [key]: value },
    }));
  }

  async function save() {
    const satErr = satError(profile.sat);
    const actErr = actError(profile.act);
    if (satErr || actErr) {
      setSaveError(satErr ?? actErr);
      return;
    }
    setSaveError(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        graduationYear: profile.graduationYear ? Number(profile.graduationYear) : undefined,
        gpa: profile.gpa ? Number(profile.gpa) : undefined,
        sat: profile.sat ?? null,
        act: profile.act ?? null,
        pronouns: profile.pronouns?.trim() || undefined,
        boardSystem: profile.boardSystem ?? null,
        academicData: profile.academicData ?? {},
      }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setSaveError(data.error ?? "Save failed");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const ad = profile.academicData ?? {};

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

        {saveError ? (
          <div className="mb-4 rounded-lg border px-3 py-2 text-sm" style={{ color: "var(--danger)", borderColor: "var(--border-soft)" }}>
            {saveError}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Identity & school
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Full name</label>
                <input className="input-base" placeholder="Legal name" value={profile.fullName ?? ""} onChange={(e) => setProfile((s) => ({ ...s, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Pronouns (optional)</label>
                <input className="input-base" placeholder="e.g. He/Him, They/Them" value={profile.pronouns ?? ""} onChange={(e) => setProfile((s) => ({ ...s, pronouns: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">School</label>
                <input className="input-base" value={profile.schoolName ?? ""} onChange={(e) => setProfile((s) => ({ ...s, schoolName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Graduation year</label>
                <input type="number" className="input-base" value={profile.graduationYear ?? ""} onChange={(e) => setProfile((s) => ({ ...s, graduationYear: Number(e.target.value) || null }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Location</label>
                <input className="input-base" value={profile.location ?? ""} onChange={(e) => setProfile((s) => ({ ...s, location: e.target.value }))} />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Board & academics
            </div>
            <div className="mt-4">
              <label className="field-label">Board system</label>
              <select
                className="input-base"
                value={profile.boardSystem ?? ""}
                onChange={(e) => setProfile((s) => ({ ...s, boardSystem: (e.target.value || null) as BoardSystem }))}
              >
                <option value="">Select board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="IB">IB</option>
                <option value="AP">AP</option>
              </select>
            </div>

            {(profile.boardSystem === "CBSE" || profile.boardSystem === "ICSE") && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["class9", "class10", "class11", "class12Predicted"] as const).map((key) => (
                  <div key={key}>
                    <label className="field-label">{key.replace(/([0-9])/g, " $1").replace("class ", "Class ")} %</label>
                    <input
                      type="number"
                      className="input-base"
                      value={(ad[key] as number | undefined) ?? ""}
                      onChange={(e) => setAcademicField(key, Number(e.target.value) || null)}
                    />
                  </div>
                ))}
              </div>
            )}

            {profile.boardSystem === "IB" && (
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="field-label">HL subjects</label>
                  <input className="input-base" value={(ad.hlSubjects as string) ?? ""} onChange={(e) => setAcademicField("hlSubjects", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">SL subjects</label>
                  <input className="input-base" value={(ad.slSubjects as string) ?? ""} onChange={(e) => setAcademicField("slSubjects", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Predicted grades</label>
                  <input className="input-base" value={(ad.predictedGrades as string) ?? ""} onChange={(e) => setAcademicField("predictedGrades", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Total predicted score (24–45)</label>
                  <input
                    type="number"
                    className="input-base"
                    value={(ad.totalPredicted as number | undefined) ?? ""}
                    onChange={(e) => setAcademicField("totalPredicted", Number(e.target.value) || null)}
                  />
                </div>
              </div>
            )}

            {profile.boardSystem === "AP" && (
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="field-label">AP subjects</label>
                  <input className="input-base" value={(ad.apSubjects as string) ?? ""} onChange={(e) => setAcademicField("apSubjects", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">AP scores</label>
                  <input className="input-base" value={(ad.apScores as string) ?? ""} onChange={(e) => setAcademicField("apScores", e.target.value)} />
                </div>
                <div>
                  <label className="field-label">GPA (if applicable)</label>
                  <input type="number" step="0.01" className="input-base" value={profile.gpa ?? ""} onChange={(e) => setProfile((s) => ({ ...s, gpa: Number(e.target.value) || null }))} />
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {profile.boardSystem !== "AP" ? (
                <div>
                  <label className="field-label">GPA (u.w.)</label>
                  <input type="number" step="0.01" className="input-base" value={profile.gpa ?? ""} onChange={(e) => setProfile((s) => ({ ...s, gpa: Number(e.target.value) || null }))} />
                </div>
              ) : null}
              <div>
                <label className="field-label">SAT (400–1600)</label>
                <input
                  type="number"
                  className="input-base"
                  value={profile.sat ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, sat: e.target.value === "" ? null : Number(e.target.value) }))}
                />
                {satError(profile.sat) ? <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{satError(profile.sat)}</p> : null}
              </div>
              <div>
                <label className="field-label">ACT (1–36)</label>
                <input
                  type="number"
                  className="input-base"
                  value={profile.act ?? ""}
                  onChange={(e) => setProfile((s) => ({ ...s, act: e.target.value === "" ? null : Number(e.target.value) }))}
                />
                {actError(profile.act) ? <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{actError(profile.act)}</p> : null}
              </div>
            </div>
            <div className="mt-4">
              <label className="field-label">Intended majors</label>
              <input className="input-base" placeholder="Comma-separated" value={profile.intendedMajors ?? ""} onChange={(e) => setProfile((s) => ({ ...s, intendedMajors: e.target.value }))} />
            </div>
          </section>

          <section className="panel p-5 lg:col-span-2">
            <div className="section-heading border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
              Narrative context
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Interests & spikes</label>
                <textarea className="input-base min-h-[7rem] resize-y leading-relaxed" value={profile.interests ?? ""} onChange={(e) => setProfile((s) => ({ ...s, interests: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Counselor / strategy notes</label>
                <textarea className="input-base min-h-[7rem] resize-y leading-relaxed" value={profile.notes ?? ""} onChange={(e) => setProfile((s) => ({ ...s, notes: e.target.value }))} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
