"use client";

import * as React from "react";

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

export default function CounselorSettingsPage() {
  const [organization, setOrganization] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [yearsExperience, setYearsExperience] = React.useState("");
  const [maxStudents, setMaxStudents] = React.useState("30");
  const [specialisations, setSpecialisations] = React.useState<string[]>([]);
  const [email, setEmail] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/counselor/profile");
      if (!res.ok) return;
      const data = (await res.json()) as {
        profile: {
          organization?: string | null;
          bio?: string | null;
          yearsExperience?: number | null;
          maxStudents: number;
        };
        user?: { email?: string | null };
        specialisations: string[];
      };
      setOrganization(data.profile.organization ?? "");
      setBio(data.profile.bio ?? "");
      setYearsExperience(data.profile.yearsExperience?.toString() ?? "");
      setMaxStudents(String(data.profile.maxStudents));
      setSpecialisations(data.specialisations ?? []);
      setEmail(data.user?.email ?? "");
      setLoading(false);
    })();
  }, []);

  function toggleSpec(s: string) {
    setSpecialisations((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    await fetch("/api/counselor/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization: organization.trim(),
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        maxStudents: Number(maxStudents) || 30,
        specialisations,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="page-wrap py-10">
        <p className="section-meta">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-2xl py-10">
        <h1 className="page-title">Counselor settings</h1>
        <p className="page-subtitle">Manage your professional profile and roster capacity.</p>

        <section className="panel mt-6 p-6">
          <div className="grid gap-4">
            <div>
              <label className="field-label">Email</label>
              <input className="input-base w-full" value={email} disabled />
            </div>
            <div>
              <label className="field-label">Organisation</label>
              <input className="input-base w-full" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Bio</label>
              <textarea className="input-base h-24 w-full resize-y" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Years of experience</label>
              <input
                className="input-base w-full"
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Max students</label>
              <input
                className="input-base w-full"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
              />
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
            <button type="button" className="btn-primary" onClick={() => void save()}>
              {saved ? "Saved ✓" : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
