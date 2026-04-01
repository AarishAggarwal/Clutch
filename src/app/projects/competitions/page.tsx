"use client";

import * as React from "react";

const STORAGE = "projectCompetitions:v1";

type Row = { id: string; name: string; deadline: string; url: string; notes: string };

export default function ProjectCompetitionsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [form, setForm] = React.useState({ name: "", deadline: "", url: "", notes: "" });
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setRows(JSON.parse(raw) as Row[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE, JSON.stringify(rows));
  }, [rows, hydrated]);

  function addRow() {
    const name = form.name.trim();
    if (!name) return;
    setRows((r) => [
      ...r,
      {
        id: `c-${Date.now()}`,
        name,
        deadline: form.deadline.trim(),
        url: form.url.trim(),
        notes: form.notes.trim(),
      },
    ]);
    setForm({ name: "", deadline: "", url: "", notes: "" });
  }

  function removeRow(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="section-meta">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap py-6">
        <h1 className="page-title">Competitions</h1>
        <p className="page-subtitle mb-6">
          Track fairs, hackathons, science fairs, and scholarship deadlines alongside your build timeline.
        </p>

        <div className="panel space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="field-label">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-base"
                placeholder="e.g., Regeneron ISEF regional"
              />
            </div>
            <div>
              <label className="field-label">Deadline</label>
              <input
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="input-base"
                placeholder="e.g., 2026-03-15"
              />
            </div>
            <div>
              <label className="field-label">URL</label>
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="input-base"
                placeholder="https://…"
              />
            </div>
          </div>
          <div>
            <label className="field-label">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input-base"
              placeholder="Requirements, theme, prize…"
            />
          </div>
          <button type="button" onClick={addRow} className="btn-primary">
            Add competition
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-soft)" }}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead style={{ background: "var(--bg-elevated)" }}>
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Deadline</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className="px-3 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="section-meta px-3 py-6 text-center">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                      {r.name}
                    </td>
                    <td className="px-3 py-2 section-meta">{r.deadline || "—"}</td>
                    <td className="px-3 py-2">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline-offset-2 hover:underline">
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 section-meta max-w-xs truncate" title={r.notes}>
                      {r.notes || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeRow(r.id)} className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
