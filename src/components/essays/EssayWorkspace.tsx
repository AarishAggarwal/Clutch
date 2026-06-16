"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { UniversityRecord } from "@/lib/universityTypes";
import { getSupplementalCatalogEntryForSlug } from "@/lib/supplementalPrompts";
import { limitStatus, parseLimitFromPrompt } from "@/lib/essayLimits";
import EssayRichEditor, { type EssayEditorSelection } from "@/components/essays/EssayRichEditor";
import EssayCommentsPanel, { type EssayComment } from "@/components/essays/EssayCommentsPanel";
import VersionHistoryPanel, { type EssayVersion } from "@/components/essays/VersionHistoryPanel";
import MaterialIcon from "@/components/shell/MaterialIcon";

type Essay = {
  id: string;
  title: string;
  essayType: string;
  content: string;
  richContent?: string | null;
  plainText?: string | null;
  status: string;
  wordCount: number;
  characterCount: number;
  notes?: string | null;
  draft: number;
  updatedAt: string;
  promptText?: string | null;
  universitySlug?: string | null;
  universityName?: string | null;
  promptId?: string | null;
  limitType?: string | null;
  limitValue?: number | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const emptyForm = {
  title: "",
  essayType: "common_app_personal_statement",
  content: "",
  richContent: "",
  plainText: "",
  status: "Draft",
  notes: "",
  draft: 1,
  promptText: "",
  universitySlug: "",
  universityName: "",
  promptId: "",
  limitType: null as string | null,
  limitValue: null as number | null,
};

export default function EssayWorkspace() {
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState<Essay[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [tab, setTab] = React.useState<"common" | "university">("common");
  const [savedUniversitySlugs, setSavedUniversitySlugs] = React.useState<string[]>([]);
  const [universities, setUniversities] = React.useState<UniversityRecord[]>([]);
  const [selectedUniversitySlug, setSelectedUniversitySlug] = React.useState("");
  const [selectedPromptId, setSelectedPromptId] = React.useState("");
  const [customPromptText, setCustomPromptText] = React.useState("");
  const [promptExpanded, setPromptExpanded] = React.useState(false);
  const [comments, setComments] = React.useState<EssayComment[]>([]);
  const [activeCommentId, setActiveCommentId] = React.useState<string | null>(null);
  const [showResolvedComments, setShowResolvedComments] = React.useState(false);
  const [selection, setSelection] = React.useState<EssayEditorSelection | null>(null);
  const [newCommentText, setNewCommentText] = React.useState("");
  const [versionsOpen, setVersionsOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<EssayVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = React.useRef(false);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  async function refreshEssays() {
    const res = await fetch("/api/essays");
    const data = (await res.json()) as { essays: Essay[] };
    setRows(data.essays);
    return data.essays;
  }

  async function loadComments(essayId: string) {
    const res = await fetch(`/api/essays/${essayId}/comments`);
    if (!res.ok) return;
    const data = (await res.json()) as { comments: EssayComment[] };
    setComments(data.comments);
  }

  React.useEffect(() => {
    void refreshEssays().then((essays) => {
      const idParam = searchParams.get("id");
      if (idParam && essays.some((e) => e.id === idParam)) setSelectedId(idParam);
      else if (essays[0]) setSelectedId(essays[0].id);
    });
    void (async () => {
      const res = await fetch("/api/universities", { cache: "no-store" });
      const data = (await res.json()) as { universities: UniversityRecord[] };
      setUniversities(data.universities);
    })();
    const raw = window.localStorage.getItem("savedUniversities");
    if (raw) setSavedUniversitySlugs(JSON.parse(raw) as string[]);
  }, []);

  React.useEffect(() => {
    if (selectedId) window.localStorage.setItem("activeEssayId", selectedId);
  }, [selectedId]);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "university" || tabParam === "common") setTab(tabParam);
    const uniParam = searchParams.get("uni");
    if (uniParam) setSelectedUniversitySlug(uniParam);
  }, [searchParams]);

  React.useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      setComments([]);
      return;
    }
    setForm({
      title: selected.title,
      essayType: selected.essayType,
      content: selected.content,
      richContent: selected.richContent ?? selected.content,
      plainText: selected.plainText ?? selected.content,
      status: selected.status,
      notes: selected.notes ?? "",
      draft: selected.draft,
      promptText: selected.promptText ?? "",
      universitySlug: selected.universitySlug ?? "",
      universityName: selected.universityName ?? "",
      promptId: selected.promptId ?? "",
      limitType: selected.limitType ?? null,
      limitValue: selected.limitValue ?? null,
    });
    void loadComments(selected.id);
    dirtyRef.current = false;
  }, [selectedId]);

  const liveLimit = limitStatus({
    limitType: (form.limitType as "word" | "character" | null) ?? null,
    limitValue: form.limitValue,
    wordCount: countWordsLocal(form.plainText),
    characterCount: form.plainText.length,
  });

  function countWordsLocal(text: string) {
    const t = text.trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  async function persistEssay(createVersion = true) {
    const plain = form.plainText.trim();
    if (!plain && !form.richContent.trim()) return;

    setSaveState("saving");
    setSaveError(null);
    const payload = {
      title: form.title.trim() || "Untitled draft",
      essayType: form.essayType,
      content: plain,
      richContent: form.richContent,
      plainText: plain,
      status: form.status,
      notes: form.notes.trim() || undefined,
      draft: Number(form.draft),
      promptText: form.promptText || undefined,
      universitySlug: form.universitySlug || undefined,
      universityName: form.universityName || undefined,
      promptId: form.promptId || undefined,
      limitType: form.limitType ?? undefined,
      limitValue: form.limitValue ?? undefined,
      createVersion,
    };

    try {
      if (selected) {
        const res = await fetch(`/api/essays/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        const data = (await res.json()) as { essay: Essay };
        setRows((prev) => prev.map((e) => (e.id === data.essay.id ? { ...e, ...data.essay } : e)));
      } else {
        const res = await fetch("/api/essays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        const data = (await res.json()) as { essay: Essay };
        setSelectedId(data.essay.id);
        await refreshEssays();
      }
      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (e: unknown) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "Could not save");
    }
  }

  function scheduleAutosave() {
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistEssay(false), 2500);
  }

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        void persistEssay(false);
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form, selected]);

  function handleEditorChange(html: string, plain: string, wordCount: number, charCount: number) {
    setForm((s) => ({ ...s, richContent: html, plainText: plain, content: plain }));
    if (selected) {
      setRows((prev) =>
        prev.map((e) => (e.id === selected.id ? { ...e, wordCount, characterCount: charCount } : e)),
      );
    }
    scheduleAutosave();
  }

  async function submitEssay() {
    if (liveLimit.exceeded) {
      setSaveError("You have exceeded the essay limit.");
      return;
    }
    await persistEssay(true);
    setForm((s) => ({ ...s, status: "Submitted" }));
    await persistEssay(true);
  }

  async function addComment() {
    if (!selected || !selection || !newCommentText.trim()) return;
    const res = await fetch(`/api/essays/${selected.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newCommentText.trim(),
        anchorStart: selection.from,
        anchorEnd: selection.to,
        quotedText: selection.text,
      }),
    });
    if (res.ok) {
      setNewCommentText("");
      setSelection(null);
      await loadComments(selected.id);
    }
  }

  async function resolveComment(id: string) {
    if (!selected) return;
    await fetch(`/api/essays/${selected.id}/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve" }),
    });
    await loadComments(selected.id);
  }

  async function reopenComment(id: string) {
    if (!selected) return;
    await fetch(`/api/essays/${selected.id}/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    await loadComments(selected.id);
    setShowResolvedComments(false);
  }

  async function replyComment(parentId: string, content: string) {
    if (!selected) return;
    await fetch(`/api/essays/${selected.id}/comments/${parentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await loadComments(selected.id);
  }

  async function openVersions() {
    if (!selected) return;
    setVersionsOpen(true);
    setVersionsLoading(true);
    const res = await fetch(`/api/essays/${selected.id}/versions`);
    const data = (await res.json()) as { versions: EssayVersion[] };
    setVersions(data.versions ?? []);
    setVersionsLoading(false);
  }

  async function restoreVersion(versionId: string) {
    if (!selected) return;
    const res = await fetch(`/api/essays/${selected.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { essay: Essay };
      setForm((s) => ({
        ...s,
        content: data.essay.content,
        richContent: data.essay.richContent ?? data.essay.content,
        plainText: data.essay.plainText ?? data.essay.content,
      }));
      await refreshEssays();
      setVersionsOpen(false);
    }
  }

  const selectedUniversity = universities.find((u) => u.slug === selectedUniversitySlug);
  const supplementalCatalog = selectedUniversity ? getSupplementalCatalogEntryForSlug(selectedUniversity.slug) : undefined;
  const promptList = supplementalCatalog?.prompts ?? [];
  const selectedPrompt = promptList.find((p) => p.id === selectedPromptId);

  function createSupplementDraft() {
    if (!selectedUniversity) return;
    const promptText = selectedPrompt ? selectedPrompt.question : customPromptText.trim();
    if (!promptText) return;
    const parsed = parseLimitFromPrompt(promptText);
    setSelectedId(null);
    setForm({
      ...emptyForm,
      essayType: "supplemental_essay",
      title: `${selectedUniversity.name} supplement`,
      promptText,
      universitySlug: selectedUniversity.slug,
      universityName: selectedUniversity.name,
      promptId: selectedPrompt?.id ?? "",
      limitType: parsed?.limitType ?? null,
      limitValue: parsed?.limitValue ?? null,
    });
  }

  const commonRows = rows.filter((r) => r.essayType.includes("common") || !r.universitySlug);
  const supplementRows = rows.filter((r) => r.universitySlug || r.essayType.includes("supplement"));
  const listRows = tab === "common" ? commonRows : supplementRows;

  const promptText = form.promptText ?? "";
  const promptPreview = promptText.length > 420 && !promptExpanded ? `${promptText.slice(0, 420)}…` : promptText;

  return (
    <div className="essay-shell flex h-full overflow-hidden">
      {sidebarCollapsed ? (
        <div className="essay-rail-collapse">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="essay-rail-expand-btn"
            title="Show essay list"
            aria-label="Expand essay sidebar"
          >
            <MaterialIcon name="chevron_right" className="!text-xl" />
          </button>
          <span
            className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-text-muted"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Essays
          </span>
        </div>
      ) : (
        <aside className="essay-rail flex w-60 shrink-0 flex-col border-r xl:w-64">
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Your essays</span>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="essay-rail-expand-btn !h-8 !w-8"
              title="Hide essay list"
              aria-label="Collapse essay sidebar"
            >
              <MaterialIcon name="chevron_left" className="!text-lg" />
            </button>
          </div>

          <div className="nav-pill mx-3 mt-3">
            <button
              type="button"
              onClick={() => setTab("common")}
              className={["nav-pill-link flex-1 text-center !text-xs", tab === "common" ? "nav-pill-link--active" : ""].join(" ")}
            >
              Common App
            </button>
            <button
              type="button"
              onClick={() => setTab("university")}
              className={["nav-pill-link flex-1 text-center !text-xs", tab === "university" ? "nav-pill-link--active" : ""].join(" ")}
            >
              Supplements
            </button>
          </div>

          {tab === "university" ? (
            <div className="space-y-2 border-b border-border-subtle px-3 py-3">
              <select value={selectedUniversitySlug} onChange={(e) => setSelectedUniversitySlug(e.target.value)} className="input-base !text-xs">
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
              <select value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)} className="input-base !text-xs" disabled={!selectedUniversity}>
                <option value="">Select prompt</option>
                {promptList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.question.slice(0, 55)}…
                  </option>
                ))}
              </select>
              {!promptList.length ? (
                <textarea value={customPromptText} onChange={(e) => setCustomPromptText(e.target.value)} placeholder="Paste the official prompt" className="input-base h-16 resize-none !text-xs" />
              ) : null}
              <button type="button" onClick={createSupplementDraft} className="btn-primary w-full !py-2 !text-xs">
                New supplement
              </button>
            </div>
          ) : (
            <div className="border-b border-border-subtle px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setForm(emptyForm);
                }}
                className="btn-secondary w-full !text-xs"
              >
                <MaterialIcon name="add" className="mr-1 !text-sm" />
                New essay
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {listRows.length === 0 ? (
              <div className="empty-state !p-3 !text-xs">No essays yet. Create one to get started.</div>
            ) : (
              listRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={["list-selectable mb-1.5 !px-3 !py-2.5", selectedId === row.id ? "list-selectable--active" : ""].join(" ")}
                >
                  <div className="truncate text-sm font-medium text-text-primary">{row.title || "Untitled"}</div>
                  <div className="section-meta mt-0.5">
                    {row.wordCount} words · {row.status}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="essay-doc-header flex flex-wrap items-center gap-3 border-b px-5 py-3 sm:px-6">
          <input
            value={form.title}
            onChange={(e) => {
              setForm((s) => ({ ...s, title: e.target.value }));
              scheduleAutosave();
            }}
            placeholder="Untitled essay"
            className="min-w-0 flex-1 border-0 bg-transparent font-display text-lg font-semibold tracking-tight text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="flex flex-wrap items-center gap-2">
            {saveState === "saving" ? <span className="badge-neutral essay-status-saving">Saving…</span> : null}
            {saveState === "saved" ? <span className="badge-accent essay-status-saved">Saved</span> : null}
            {saveState === "error" ? <span className="badge-neutral !text-error">Save failed</span> : null}
            {form.status ? <span className="badge-neutral capitalize">{form.status}</span> : null}
            <button type="button" onClick={() => void openVersions()} className="btn-secondary !px-2.5 !py-1.5 !text-xs">
              <MaterialIcon name="history" className="mr-1 !text-sm" />
              History
            </button>
            <button type="button" onClick={() => void submitEssay()} disabled={liveLimit.exceeded} className="btn-primary !px-3 !py-1.5 !text-xs disabled:opacity-45">
              Submit
            </button>
          </div>
        </header>

        {promptText ? (
          <div className="border-b border-border-subtle bg-surface-container-low px-5 py-3 sm:px-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Prompt</div>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{promptPreview}</p>
            {promptText.length > 420 ? (
              <button type="button" onClick={() => setPromptExpanded((v) => !v)} className="mt-2 text-xs font-medium text-primary hover:underline">
                {promptExpanded ? "Show less" : "Show more"}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface px-5 py-2.5 sm:px-6">
          <div className={liveLimit.exceeded ? "essay-limit-over text-sm font-medium" : "essay-limit-ok text-sm"}>
            <span className="font-data-mono font-medium text-text-primary">
              {liveLimit.max ? `${liveLimit.current} / ${liveLimit.max}` : countWordsLocal(form.plainText)}
            </span>
            <span className="ml-1">{liveLimit.max ? liveLimit.unit : "words"}</span>
            {liveLimit.remaining != null && liveLimit.remaining >= 0 ? (
              <span className="ml-2 text-text-muted">· {liveLimit.remaining} remaining</span>
            ) : null}
            {liveLimit.exceeded ? <span className="ml-2 font-medium">— Limit exceeded</span> : null}
          </div>

          {selection ? (
            <div className="flex items-center gap-2">
              <input
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Comment on selection…"
                className="input-base !w-48 !py-1.5 !text-xs sm:!w-64"
              />
              <button type="button" onClick={() => void addComment()} className="btn-primary !px-3 !py-1.5 !text-xs">
                Add comment
              </button>
            </div>
          ) : (
            <span className="hidden text-xs text-text-muted sm:inline">Select text to add a comment</span>
          )}
        </div>

        {saveError ? (
          <div className="border-b border-border-subtle bg-red-50 px-5 py-2 text-sm text-error sm:px-6">{saveError}</div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <EssayRichEditor
            content={form.richContent || form.content}
            onChange={handleEditorChange}
            onBlur={() => void persistEssay(false)}
            onSelectionChange={setSelection}
            activeCommentId={activeCommentId}
          />
          <EssayCommentsPanel
            comments={comments}
            activeId={activeCommentId}
            showResolved={showResolvedComments}
            onSelect={setActiveCommentId}
            onResolve={(id) => void resolveComment(id)}
            onReopen={(id) => void reopenComment(id)}
            onReply={(id, text) => void replyComment(id, text)}
            onToggleResolvedPanel={() => setShowResolvedComments((v) => !v)}
          />
        </div>
      </div>

      <VersionHistoryPanel
        open={versionsOpen}
        versions={versions}
        loading={versionsLoading}
        onClose={() => setVersionsOpen(false)}
        onRestore={(id) => void restoreVersion(id)}
      />
    </div>
  );
}
