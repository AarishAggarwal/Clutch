"use client";

import * as React from "react";

type Doc = {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string;
  updatedAt: string;
};

const blank = { title: "", category: "Personal Notes", content: "", tags: "" };

export default function DocumentsPage() {
  const [rows, setRows] = React.useState<Doc[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(blank);

  async function refresh() {
    const res = await fetch("/api/documents");
    const data = (await res.json()) as { documents: Doc[] };
    setRows(data.documents);
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
      content: selected.content,
      tags: JSON.parse(selected.tags || "[]").join(", "),
    });
  }, [selectedId]);

  async function save() {
    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (selected) {
      await fetch(`/api/documents/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSelectedId(null);
    setForm(blank);
    await refresh();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Application memos, brag sheets, and research notes—organized by category and tags.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <section className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="section-heading">Library</div>
              <button onClick={() => { setSelectedId(null); setForm(blank); }} className="btn-secondary px-2.5 py-1.5 text-xs">
                New
              </button>
            </div>
            <div className="mt-3 max-h-[min(60vh,30rem)] space-y-1.5 overflow-y-auto pr-1">
              {rows.length === 0 ? (
                <div className="empty-state">No documents yet. Capture deadlines, scholarship research, or school-specific plans.</div>
              ) : (
                rows.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={["list-selectable", selectedId === doc.id ? "list-selectable--active" : ""].join(" ")}
                  >
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{doc.title}</div>
                    <div className="section-meta mt-1">{doc.category}</div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-soft)" }}>
              <div>
                <div className="section-heading">{selected ? "Edit document" : "New document"}</div>
                <div className="section-meta mt-1">Plain workspace notes—upgrade to rich text in a future release.</div>
              </div>
              <button type="button" onClick={() => void save()} className="btn-primary">
                Save
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label">Title</label>
                <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="input-base" />
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
                  <label className="field-label">Tags</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                    placeholder="Comma-separated"
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  className="input-base min-h-[20rem] resize-y font-mono text-[13px] leading-relaxed"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
