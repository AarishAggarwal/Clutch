"use client";

import * as React from "react";
import IdeaCard from "@/components/projects/ideator/IdeaCard";
import {
  IDEA_MODES,
  defaultIdeaFilters,
  defaultIntakeProfile,
  type IdeaFilters,
  type IdeaModeId,
  type IntakeProfile,
  type ProjectIdea,
  type SavedIdeaEntry,
} from "@/lib/projectIdeator/types";

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ideas?: ProjectIdea[];
  modelName?: string;
  createdAt: string;
};

const CHAT_STORAGE = "projectIdeator:chat:v1";
const SAVED_STORAGE = "projectIdeator:savedIdeas:v1";

const PROJECT_TYPES = [
  "research",
  "startup",
  "app/web tool",
  "AI/ML",
  "hardware/robotics",
  "social impact",
  "nonprofit",
  "policy/advocacy",
  "finance/business",
  "cybersecurity",
  "health-tech",
  "climate/agri-tech",
  "interdisciplinary",
] as const;

const TARGETS = [
  "school impact",
  "community impact",
  "competition",
  "publication/research",
  "startup traction",
  "admissions differentiation",
] as const;

const SUGGESTIONS = [
  "Generate 5 elite admissions ideas for CS + biology with low budget.",
  "Make these ideas more unique and competition-ready.",
  "Only ideas doable with laptop-only resources.",
  "Adapt idea #2 into a 3-month execution roadmap.",
  "Give startup-worthy ideas with real pilot metrics.",
];

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ProjectIdeatorStudio() {
  const [profile, setProfile] = React.useState<IntakeProfile>(defaultIntakeProfile);
  const [filters, setFilters] = React.useState<IdeaFilters>(defaultIdeaFilters);
  const [mode, setMode] = React.useState<IdeaModeId>("elite_admissions");
  const [ideaCount, setIdeaCount] = React.useState(5);
  const [input, setInput] = React.useState("");
  const [chat, setChat] = React.useState<ChatEntry[]>([]);
  const [savedIdeas, setSavedIdeas] = React.useState<SavedIdeaEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showIntake, setShowIntake] = React.useState(true);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setChat(loadJSON<ChatEntry[]>(CHAT_STORAGE, []));
    setSavedIdeas(loadJSON<SavedIdeaEntry[]>(SAVED_STORAGE, []));
  }, []);

  React.useEffect(() => {
    localStorage.setItem(CHAT_STORAGE, JSON.stringify(chat));
  }, [chat]);

  React.useEffect(() => {
    localStorage.setItem(SAVED_STORAGE, JSON.stringify(savedIdeas));
  }, [savedIdeas]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, loading]);

  async function generate(userText?: string) {
    const text = (userText ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const userMsg: ChatEntry = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setChat((c) => [...c, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/project-ideator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          filters,
          mode,
          ideaCount,
          userMessage: text,
          messages: chat.concat(userMsg).map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
        throw new Error(payload.details ?? payload.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        assistantReply: string;
        ideas: ProjectIdea[];
        modelName: string;
      };
      const aiMsg: ChatEntry = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.assistantReply,
        ideas: data.ideas ?? [],
        modelName: data.modelName,
        createdAt: new Date().toISOString(),
      };
      setChat((c) => [...c, aiMsg]);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setChat([]);
    setError(null);
  }

  function toggleChip(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) setter(list.filter((x) => x !== value));
    else setter([...list, value]);
  }

  function isSaved(idea: ProjectIdea) {
    return savedIdeas.some((s) => s.idea.title === idea.title && s.idea.oneLineConcept === idea.oneLineConcept);
  }

  function saveIdea(idea: ProjectIdea) {
    if (isSaved(idea)) return;
    setSavedIdeas((s) => [
      ...s,
      { id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: new Date().toISOString(), favorite: false, idea, mode },
    ]);
  }

  function toggleFavorite(idea: ProjectIdea) {
    setSavedIdeas((s) =>
      s.map((x) =>
        x.idea.title === idea.title && x.idea.oneLineConcept === idea.oneLineConcept ? { ...x, favorite: !x.favorite } : x,
      ),
    );
  }

  function isFavorite(idea: ProjectIdea) {
    return savedIdeas.some((s) => s.idea.title === idea.title && s.idea.oneLineConcept === idea.oneLineConcept && s.favorite);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b px-4 py-4 sm:px-6" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Project Ideator
            </h1>
            <p className="section-meta mt-1 max-w-3xl">
              Elite innovation strategist for standout, admissions-worthy projects with realistic execution plans.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowIntake((v) => !v)} className="btn-secondary text-sm">
              {showIntake ? "Hide intake" : "Show intake"}
            </button>
            <button type="button" onClick={clearChat} className="btn-secondary text-sm">
              New thread
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[20rem_1fr_20rem]">
        {showIntake ? (
          <aside className="overflow-y-auto border-r p-4 sm:p-5" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
            <div className="space-y-3">
              <div className="section-heading">Intake</div>
              <Input label="Grade level" value={profile.gradeLevel} onChange={(v) => setProfile((p) => ({ ...p, gradeLevel: v }))} />
              <Input label="Intended major(s)" value={profile.intendedMajors} onChange={(v) => setProfile((p) => ({ ...p, intendedMajors: v }))} />
              <Input label="Career interests" value={profile.careerInterests} onChange={(v) => setProfile((p) => ({ ...p, careerInterests: v }))} />
              <Input label="Current skills" value={profile.skills} onChange={(v) => setProfile((p) => ({ ...p, skills: v }))} />
              <Input label="Time available" value={profile.timeAvailable} onChange={(v) => setProfile((p) => ({ ...p, timeAvailable: v }))} />
              <Input label="Budget range" value={profile.budgetRange} onChange={(v) => setProfile((p) => ({ ...p, budgetRange: v }))} />
              <Input label="Country / region" value={profile.region} onChange={(v) => setProfile((p) => ({ ...p, region: v }))} />
              <Input label="Resources" value={profile.resources} onChange={(v) => setProfile((p) => ({ ...p, resources: v }))} />

              <Select
                label="Skill level"
                value={profile.skillLevel}
                onChange={(v) => setProfile((p) => ({ ...p, skillLevel: v as IntakeProfile["skillLevel"] }))}
                options={["", "beginner", "intermediate", "advanced"]}
              />
              <Select
                label="Team or solo"
                value={profile.teamOrSolo}
                onChange={(v) => setProfile((p) => ({ ...p, teamOrSolo: v as IntakeProfile["teamOrSolo"] }))}
                options={["", "solo", "team", "either"]}
              />
              <Select
                label="Ambition"
                value={profile.ambition}
                onChange={(v) => setProfile((p) => ({ ...p, ambition: v as IntakeProfile["ambition"] }))}
                options={["", "safe", "strong", "elite"]}
              />
              <Select
                label="Build pace"
                value={profile.buildPace}
                onChange={(v) => setProfile((p) => ({ ...p, buildPace: v as IntakeProfile["buildPace"] }))}
                options={["", "fast", "deep"]}
              />
              <div>
                <div className="field-label">Preferred project types</div>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_TYPES.map((t) => (
                    <Chip
                      key={t}
                      active={profile.projectTypes.includes(t)}
                      onClick={() => toggleChip(profile.projectTypes, t, (v) => setProfile((p) => ({ ...p, projectTypes: v })))}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">Desired outcomes</div>
                <div className="flex flex-wrap gap-1.5">
                  {TARGETS.map((t) => (
                    <Chip
                      key={t}
                      active={profile.targetOutcomes.includes(t)}
                      onClick={() => toggleChip(profile.targetOutcomes, t, (v) => setProfile((p) => ({ ...p, targetOutcomes: v })))}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        ) : null}

        <main className="flex min-h-0 flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
          <div className="border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--border-soft)" }}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="field-label">Idea mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as IdeaModeId)} className="input-base min-w-[15rem]">
                  {IDEA_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Idea count</label>
                <input
                  type="number"
                  min={3}
                  max={7}
                  value={ideaCount}
                  onChange={(e) => setIdeaCount(Math.max(3, Math.min(7, Number(e.target.value) || 5)))}
                  className="input-base w-24"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => void generate(s)} type="button" className="btn-ghost rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border-soft)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-4xl space-y-5">
              {chat.length === 0 ? (
                <div className="panel rounded-2xl p-8 text-center">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Build a standout project concept
                  </h2>
                  <p className="section-meta mt-2">
                    Share your context and constraints. The ideator will return ranked, non-generic ideas with execution plans.
                  </p>
                </div>
              ) : null}

              {chat.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl border px-4 py-3 text-sm shadow-sm" style={{ borderColor: "var(--border-strong)", background: "var(--text-primary)", color: "var(--bg-elevated)" }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">You</div>
                      <div className="mt-1.5 whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="space-y-3">
                    <div className="panel rounded-2xl px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        Project ideator {m.modelName ? `· ${m.modelName}` : ""}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {m.text}
                      </p>
                    </div>
                    {m.ideas?.map((idea, idx) => (
                      <IdeaCard
                        key={`${m.id}-${idx}-${idea.title}`}
                        idea={idea}
                        index={idx}
                        onSave={() => saveIdea(idea)}
                        onToggleFavorite={() => toggleFavorite(idea)}
                        isSaved={isSaved(idea)}
                        isFavorite={isFavorite(idea)}
                      />
                    ))}
                  </div>
                ),
              )}

              {loading ? (
                <div className="panel-muted rounded-2xl px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent)" }} />
                    Generating differentiated ideas...
                  </span>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border px-3 py-2 text-sm" style={{ color: "var(--danger)", borderColor: "color-mix(in oklab, var(--danger) 35%, var(--border-soft))" }}>
                  {error}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t p-4 sm:p-6" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
            <div className="mx-auto max-w-4xl">
              <label className="field-label">Ask for new ideas or refine previous ones</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void generate();
                  }
                }}
                placeholder="e.g., Make these more unique and feasible with a $100 budget and no hardware."
                rows={4}
                disabled={loading}
                className="input-base resize-y leading-relaxed"
              />
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => void generate()} disabled={loading || !input.trim()} className="btn-primary">
                  Generate ideas
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden overflow-y-auto border-l p-4 lg:block" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="section-heading">Saved ideas</div>
            <span className="section-meta">{savedIdeas.length}</span>
          </div>
          <div className="space-y-2">
            {savedIdeas.length === 0 ? (
              <p className="section-meta">Save strong ideas to shortlist for execution.</p>
            ) : (
              savedIdeas
                .slice()
                .reverse()
                .map((s) => (
                  <div key={s.id} className="rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {s.favorite ? "★ " : ""}
                      {s.idea.title}
                    </div>
                    <p className="mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {s.idea.oneLineConcept}
                    </p>
                    <div className="mt-1 section-meta">{new Date(s.savedAt).toLocaleDateString()}</div>
                  </div>
                ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border-soft)",
        color: active ? "var(--accent-strong)" : "var(--text-secondary)",
        background: active ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "var(--bg-elevated)",
      }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input-base" />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base">
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </div>
  );
}

