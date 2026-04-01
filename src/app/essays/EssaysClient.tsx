"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { UniversityRecord } from "@/lib/universityTypes";
import { getSupplementalCatalogEntryForSlug } from "@/lib/supplementalPrompts";

type Essay = {
  id: string;
  title: string;
  essayType: string;
  content: string;
  status: string;
  wordCount: number;
  notes?: string | null;
  draft: number;
  updatedAt: string;
};

const emptyDraft = {
  title: "",
  essayType: "common_app_personal_statement",
  content: "",
  status: "Draft",
  notes: "",
  draft: 1,
};

export default function EssaysClient() {
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState<Essay[]>([]);
  const [form, setForm] = React.useState(emptyDraft);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"common" | "university">("common");
  const [savedUniversitySlugs, setSavedUniversitySlugs] = React.useState<string[]>([]);
  const [universities, setUniversities] = React.useState<UniversityRecord[]>([]);
  const [selectedUniversitySlug, setSelectedUniversitySlug] = React.useState("");
  const [selectedPromptId, setSelectedPromptId] = React.useState("");
  const [customPromptText, setCustomPromptText] = React.useState("");

  async function refresh() {
    const res = await fetch("/api/essays");
    const data = (await res.json()) as { essays: Essay[] };
    setRows(data.essays);
    if (!selectedId && data.essays[0]) setSelectedId(data.essays[0].id);
  }

  React.useEffect(() => {
    void refresh();
    void (async () => {
      const res = await fetch("/api/universities");
      const data = (await res.json()) as { universities: UniversityRecord[] };
      setUniversities(data.universities);
    })();
    const raw = window.localStorage.getItem("savedUniversities");
    if (raw) {
      const slugs = JSON.parse(raw) as string[];
      setSavedUniversitySlugs(slugs);
    }
  }, []);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "university" || tabParam === "common") setTab(tabParam);
    const uniParam = searchParams.get("uni");
    if (uniParam) setSelectedUniversitySlug(uniParam);
  }, [searchParams]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const selectedUniversity = universities.find((u) => u.slug === selectedUniversitySlug);
  const supplementalCatalog = selectedUniversity ? getSupplementalCatalogEntryForSlug(selectedUniversity.slug) : undefined;
  const promptList = supplementalCatalog?.prompts ?? [];
  const selectedPrompt = promptList.find((p) => p.id === selectedPromptId);

  async function save() {
    const payload = {
      ...form,
      content: form.content.trim(),
      notes: form.notes.trim() || undefined,
      draft: Number(form.draft),
    };
    if (selected) {
      await fetch(`/api/essays/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    await refresh();
  }

  React.useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title,
      essayType: selected.essayType,
      content: selected.content,
      status: selected.status,
      notes: selected.notes ?? "",
      draft: selected.draft,
    });
  }, [selectedId]);

  React.useEffect(() => {
    if (tab !== "university") return;
    if (!selectedUniversitySlug && savedUniversitySlugs[0]) {
      setSelectedUniversitySlug(savedUniversitySlugs[0]);
    }
  }, [tab, savedUniversitySlugs, selectedUniversitySlug]);

  function usePromptInEditor() {
    if (!selectedUniversity) return;
    const promptText = selectedPrompt ? selectedPrompt.question : customPromptText.trim();
    if (!promptText) return;
    setForm((s) => ({
      ...s,
      essayType: "supplemental_essay",
      title: `${selectedUniversity.name} — ${promptText.slice(0, 52)}`,
      notes: `Prompt (${selectedPrompt?.cycleYear ?? "2026-27"}): ${promptText}`,
    }));
  }

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Essay workspace</h1>
            <p className="page-subtitle">Common App and supplements with structured metadata—counselor-grade organization.</p>
          </div>
          <div className="section-meta">All drafts stay local in your workspace database.</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <section className="panel flex flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="section-heading">Library</div>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setForm(emptyDraft);
                }}
                className="btn-secondary px-2.5 py-1.5 text-xs"
              >
                New
              </button>
            </div>

            <div className="nav-pill mt-3 w-full">
              <button
                type="button"
                onClick={() => setTab("common")}
                className={["nav-pill-link flex-1 text-center", tab === "common" ? "nav-pill-link--active" : ""].join(" ")}
              >
                Common App
              </button>
              <button
                type="button"
                onClick={() => setTab("university")}
                className={["nav-pill-link flex-1 text-center", tab === "university" ? "nav-pill-link--active" : ""].join(" ")}
              >
                Supplements
              </button>
            </div>

            {tab === "university" ? (
              <div className="panel-muted mt-3 space-y-2 p-3">
                <div className="section-heading text-xs">Prompt setup</div>
                <label className="field-label">From your list</label>
                <select
                  value={selectedUniversitySlug}
                  onChange={(e) => {
                    setSelectedUniversitySlug(e.target.value);
                    setSelectedPromptId("");
                    setCustomPromptText("");
                  }}
                  className="input-base"
                >
                  <option value="">Select university</option>
                  {savedUniversitySlugs.map((slug) => {
                    const uni = universities.find((u) => u.slug === slug);
                    return uni ? (
                      <option key={slug} value={slug}>
                        {uni.name}
                      </option>
                    ) : null;
                  })}
                </select>
                {supplementalCatalog?.submissionDeadlines ? (
                  <div className="section-meta whitespace-pre-line rounded-md border border-[var(--border-soft)] p-2 text-xs">
                    {supplementalCatalog.submissionDeadlines}
                  </div>
                ) : null}
                <label className="field-label">Prompt</label>
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="input-base"
                  disabled={!selectedUniversity}
                >
                  <option value="">{selectedUniversity ? "Select prompt" : "Select university first"}</option>
                  {promptList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.cycleYear}] {p.question}
                    </option>
                  ))}
                </select>
                {!promptList.length ? (
                  <textarea
                    value={customPromptText}
                    onChange={(e) => setCustomPromptText(e.target.value)}
                    placeholder="Paste the official prompt if no catalog match."
                    className="input-base h-20 resize-none"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={usePromptInEditor}
                  disabled={!selectedUniversity || (!selectedPrompt && !customPromptText.trim())}
                  className="btn-primary w-full text-xs disabled:opacity-50"
                >
                  Apply to editor
                </button>
              </div>
            ) : null}

            <div className="mt-3 max-h-[min(52vh,28rem)] space-y-1.5 overflow-y-auto pr-1">
              {rows.length === 0 ? (
                <div className="empty-state">No essays yet. Create one to track drafts alongside chat reviews.</div>
              ) : (
                rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={[
                      "list-selectable",
                      selectedId === row.id ? "list-selectable--active" : "",
                    ].join(" ")}
                  >
                    <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {row.title || "Untitled"}
                    </div>
                    <div className="section-meta mt-1 line-clamp-2">
                      {row.status} · {row.wordCount} words · {new Date(row.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="panel flex flex-col p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-soft)" }}>
              <div>
                <div className="section-heading">{selected ? "Edit draft" : "New draft"}</div>
                <div className="section-meta mt-1">Autosave on Save. Word count updates as you type.</div>
              </div>
              <button type="button" onClick={() => void save()} className="btn-primary">
                Save essay
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Essay title"
                  className="input-base"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="field-label">Type key</label>
                  <input
                    value={form.essayType}
                    onChange={(e) => setForm((s) => ({ ...s, essayType: e.target.value }))}
                    placeholder="Essay type"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="field-label">Status</label>
                  <input
                    value={form.status}
                    onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                    placeholder="Draft / Ready…"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="field-label">Revision</label>
                  <input
                    type="number"
                    value={form.draft}
                    onChange={(e) => setForm((s) => ({ ...s, draft: Number(e.target.value) || 1 }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Body</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  placeholder="Write or paste your essay…"
                  className="input-base min-h-[14rem] resize-y leading-relaxed"
                />
              </div>
              <div>
                <label className="field-label">Counselor notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Internal notes, feedback to revisit…"
                  className="input-base h-24 resize-y"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                <span className="section-meta">
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                    {wordCount}
                  </span>{" "}
                  words
                </span>
                <span className="chip chip-teal">Local-first</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
