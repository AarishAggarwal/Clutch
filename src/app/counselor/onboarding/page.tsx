"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const SPECIALISATION_OPTIONS = [
  "US",
  "UK",
  "Canada",
  "Ivy League",
  "STEM",
  "Liberal Arts",
  "Scholarships",
  "Financial Aid",
  "International",
];

export default function CounselorOnboardingPage() {
  const router = useRouter();
  const [organization, setOrganization] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [yearsExperience, setYearsExperience] = React.useState("");
  const [maxStudents, setMaxStudents] = React.useState("30");
  const [specialisations, setSpecialisations] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function toggleSpec(s: string) {
    setSpecialisations((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!organization.trim()) {
      setError("Organisation is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/counselor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: organization.trim(),
          bio: bio.trim() || undefined,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          maxStudents: Number(maxStudents) || 30,
          specialisations,
          onboardingComplete: true,
        }),
      });
      if (!res.ok) {
        setError("Could not save profile.");
        return;
      }
      router.push("/counselor/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-2xl py-10">
        <section className="panel p-6 sm:p-8">
          <h1 className="page-title">Set up your counselor profile</h1>
          <p className="page-subtitle mt-1">
            Tell us about your practice so students and your workspace can reflect your expertise.
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="field-label">Organisation / school *</label>
              <input className="input-base w-full" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Years of experience</label>
              <input
                className="input-base w-full"
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Bio</label>
              <textarea className="input-base h-24 w-full resize-y" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Specialisations</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPECIALISATION_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpec(s)}
                    className={["rounded-full border px-3 py-1 text-xs", specialisations.includes(s) ? "nav-pill-link--active" : ""].join(" ")}
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Max students on roster</label>
              <input
                className="input-base w-full"
                type="number"
                min={1}
                max={200}
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? "Saving…" : "Finish setup and go to dashboard"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
