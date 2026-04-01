"use client";

import * as React from "react";
import Link from "next/link";

type Activity = {
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
};

const base = {
  title: "",
  category: "Leadership",
  organization: "",
  role: "",
  grades: "9-12",
  hoursPerWeek: 4,
  weeksPerYear: 32,
  description: "",
  achievementNotes: "",
};

export default function ActivitiesPage() {
  const [rows, setRows] = React.useState<Activity[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(base);

  async function refresh() {
    const res = await fetch("/api/activities");
    const data = (await res.json()) as { activities: Activity[] };
    setRows(data.activities);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title,
      category: selected.category,
      organization: selected.organization,
      role: selected.role,
      grades: selected.grades,
      hoursPerWeek: selected.hoursPerWeek,
      weeksPerYear: selected.weeksPerYear,
      description: selected.description,
      achievementNotes: selected.achievementNotes ?? "",
    });
  }, [selectedId]);

  async function save() {
    if (selected) {
      await fetch(`/api/activities/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSelectedId(null);
    setForm(base);
    await refresh();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Activities</h1>
            <p className="page-subtitle">
              Build your Common App–style activity list with roles, time commitment, and impact notes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/activities/competitions" className="btn-secondary shrink-0">
              Competitions
            </Link>
            <Link href="/projects/progress" className="btn-primary shrink-0">
              Create project
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <section className="panel flex flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="section-heading">Entries</div>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setForm(base);
                }}
                className="btn-secondary px-2.5 py-1.5 text-xs"
              >
                New
              </button>
            </div>
            <div className="mt-3 max-h-[min(60vh,32rem)] space-y-1.5 overflow-y-auto pr-1">
              {rows.length === 0 ? (
                <div className="empty-state">Add your first activity—each line becomes part of your admissions narrative.</div>
              ) : (
                rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={["list-selectable", selectedId === row.id ? "list-selectable--active" : ""].join(" ")}
                  >
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {row.title}
                    </div>
                    <div className="section-meta mt-1">
                      {row.category} · {row.organization}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-soft)" }}>
              <div>
                <div className="section-heading">{selected ? "Edit entry" : "New entry"}</div>
                <div className="section-meta mt-1">Capture what admissions readers evaluate: scope, commitment, impact.</div>
              </div>
              <button type="button" onClick={() => void save()} className="btn-primary">
                Save activity
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label">Activity name</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g., Debate team captain"
                  className="input-base"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="field-label">Organization</label>
                  <input
                    value={form.organization}
                    onChange={(e) => setForm((s) => ({ ...s, organization: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="field-label">Role</label>
                  <input value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="field-label">Grades</label>
                  <input value={form.grades} onChange={(e) => setForm((s) => ({ ...s, grades: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="field-label">Hours / week</label>
                  <input
                    type="number"
                    value={form.hoursPerWeek}
                    onChange={(e) => setForm((s) => ({ ...s, hoursPerWeek: Number(e.target.value) || 0 }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="field-label">Weeks / year</label>
                  <input
                    type="number"
                    value={form.weeksPerYear}
                    onChange={(e) => setForm((s) => ({ ...s, weeksPerYear: Number(e.target.value) || 1 }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="What you did and how you contributed…"
                  className="input-base min-h-[6.5rem] resize-y leading-relaxed"
                />
              </div>
              <div>
                <label className="field-label">Recognition & impact</label>
                <textarea
                  value={form.achievementNotes}
                  onChange={(e) => setForm((s) => ({ ...s, achievementNotes: e.target.value }))}
                  placeholder="Awards, measurable outcomes, leadership scope…"
                  className="input-base h-24 resize-y"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
