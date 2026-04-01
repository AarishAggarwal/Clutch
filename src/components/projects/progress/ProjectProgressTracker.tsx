"use client";

import * as React from "react";
import Link from "next/link";
import {
  CATEGORIES,
  STAGES,
  type Milestone,
  type ProjectProgressState,
  type Task,
  type TaskPriority,
  STORAGE_KEY,
  defaultState,
  migrateState,
  daysUntil,
  urgencyLabel,
  overallCompletion,
  projectedCompletionDate,
  stageIndex,
  parseDate,
  isoWeekKey,
  milestoneAvgPct,
} from "@/lib/projectProgressModel";

function Ring({ pct, size = 160, stroke = 12 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="text-[var(--accent)]"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function MiniRing({ pct }: { pct: number }) {
  return <Ring pct={pct} size={56} stroke={6} />;
}

function LineChart({
  planned,
  actual,
}: {
  planned: { x: number; y: number }[];
  actual: { x: number; y: number }[];
}) {
  const W = 560;
  const H = 200;
  const pad = 24;
  const line = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return "";
    const x0 = pad + pts[0].x * (W - pad * 2);
    const y0 = H - pad - pts[0].y * (H - pad * 2);
    let d = `M ${x0} ${y0}`;
    for (let i = 1; i < pts.length; i++) {
      const xi = pad + pts[i].x * (W - pad * 2);
      const yi = H - pad - pts[i].y * (H - pad * 2);
      d += ` L ${xi} ${yi}`;
    }
    return d;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full max-w-full">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border-soft)" strokeWidth="1" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--border-soft)" strokeWidth="1" />
      <path d={line(planned)} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="6 4" opacity="0.85" />
      <path d={line(actual)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      {actual.map((p, i) => (
        <circle
          key={i}
          cx={pad + p.x * (W - pad * 2)}
          cy={H - pad - p.y * (H - pad * 2)}
          r="4"
          fill="var(--bg-elevated)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

function MilestoneDonutVisual({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let deg = 0;
  const stops = segments.map((s) => {
    const span = (s.value / total) * 360;
    const start = deg;
    deg += span;
    return `${s.color} ${start}deg ${deg}deg`;
  });
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
      <div
        className="relative h-44 w-44 shrink-0 rounded-full shadow-inner"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
          boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--border-soft) 80%, transparent)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--bg-elevated)" }}
        />
      </div>
      <ul className="space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
            <span className="section-meta tabular-nums">{Number.isInteger(s.value) ? s.value : s.value.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const priorityStyle: Record<TaskPriority, string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  med: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
  low: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
};

export default function ProjectProgressTracker() {
  const [state, setState] = React.useState<ProjectProgressState>(defaultState);
  const [hydrated, setHydrated] = React.useState(false);
  const [taskView, setTaskView] = React.useState<"checklist" | "kanban" | "planner">("checklist");
  const [highlight, setHighlight] = React.useState<string | null>(null);
  const milestonesRef = React.useRef<HTMLDivElement>(null);
  const tasksRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(migrateState(JSON.parse(raw)));
      else {
        const legacy = localStorage.getItem("projectProgress:v1");
        if (legacy) setState(migrateState(JSON.parse(legacy)));
        else setState(defaultState());
      }
    } catch {
      setState(defaultState());
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  React.useEffect(() => {
    if (!highlight) return;
    const id = window.setTimeout(() => setHighlight(null), 3800);
    return () => clearTimeout(id);
  }, [highlight]);

  const overall = overallCompletion(state.milestones, state.tasks);
  const dLeft = daysUntil(state.eventDeadline);
  const urg = urgencyLabel(dLeft);
  const stageIdx = stageIndex(state.stage);
  const { projected, pace } = projectedCompletionDate(state.durationWeeks, overall, state.eventDeadline);

  const plannedLine = React.useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => ({ x: i / (n - 1), y: i / (n - 1) }));
  }, []);

  const actualLine = React.useMemo(() => {
    const snaps = [...state.progressSnapshots].sort((a, b) => a.at.localeCompare(b.at));
    if (snaps.length >= 2) {
      return snaps.map((s, i) => ({ x: i / Math.max(1, snaps.length - 1), y: s.pct / 100 }));
    }
    const n = 6;
    return Array.from({ length: n }, (_, i) => ({
      x: i / (n - 1),
      y: (overall / 100) * (i / (n - 1)) * 0.85 + 0.05,
    }));
  }, [state.progressSnapshots, overall]);

  const milestoneDonut = React.useMemo(() => {
    const ms = state.milestones;
    if (!ms.length) {
      return [{ label: "Add milestones", value: 1, color: "var(--border-strong)" }];
    }
    let a = 0,
      b = 0,
      c = 0;
    for (const m of ms) {
      if (m.status === "done") a++;
      else if (m.status === "in_progress") b++;
      else c++;
    }
    const segs = [
      { label: "Done", value: a, color: "var(--accent)" },
      { label: "In progress", value: b, color: "#6366f1" },
      { label: "Not started", value: c, color: "var(--border-strong)" },
    ].filter((x) => x.value > 0);
    return segs.length ? segs : [{ label: "No status data", value: 1, color: "var(--border-strong)" }];
  }, [state.milestones]);

  const weeklyBars = React.useMemo(() => {
    const entries = Object.entries(state.weeklyProductivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({ key: k, v, pct: (v / max) * 100 }));
  }, [state.weeklyProductivity]);

  function setField<K extends keyof ProjectProgressState>(key: K, value: ProjectProgressState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function addSnapshot() {
    setState((s) => ({
      ...s,
      progressSnapshots: [...s.progressSnapshots, { at: new Date().toISOString(), pct: overall }],
    }));
  }

  function addMilestone() {
    const m: Milestone = {
      id: `m-${Date.now()}`,
      title: "New milestone",
      dueDate: state.eventDeadline || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: "not_started",
      completionPct: 0,
      linkedTaskIds: [],
      evidenceUploaded: false,
      notes: "",
    };
    setState((s) => ({ ...s, milestones: [...s.milestones, m] }));
    setHighlight(m.id);
    setTimeout(() => milestonesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function addTask() {
    const t: Task = {
      id: `t-${Date.now()}`,
      title: "New task",
      priority: "med",
      dueDate: "",
      estHours: 2,
      actualHours: 0,
      owner: "",
      dependencies: "",
      attachments: "",
      notes: "",
      done: false,
      column: "backlog",
    };
    setState((s) => ({ ...s, tasks: [...s.tasks, t] }));
    setHighlight(t.id);
    setTimeout(() => tasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function bumpWeekHours() {
    const k = isoWeekKey(new Date());
    setState((s) => ({
      ...s,
      weeklyProductivity: { ...s.weeklyProductivity, [k]: (s.weeklyProductivity[k] ?? 0) + 1 },
    }));
  }

  const overdueTasks = state.tasks.filter((t) => {
    const d = parseDate(t.dueDate);
    return d && d < new Date() && !t.done;
  });
  const upcomingTasks = state.tasks
    .filter((t) => parseDate(t.dueDate) && !t.done)
    .sort((a, b) => (parseDate(a.dueDate)!.getTime() - parseDate(b.dueDate)!.getTime()))
    .slice(0, 6);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="section-meta">Loading your command center…</p>
      </div>
    );
  }

  return (
    <div className="tracker-root h-full overflow-y-auto scroll-smooth">
      <div className="page-wrap max-w-6xl pb-24 pt-8">
        {/* Hero */}
        <section className="tracker-hero relative overflow-hidden rounded-2xl border p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)] dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] sm:p-8 md:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "color-mix(in oklab, var(--accent) 45%, transparent)" }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
                  Innovation command center
                </span>
                <Link href="/" className="text-xs font-medium underline-offset-4 hover:underline" style={{ color: "var(--accent)" }}>
                  Home dashboard
                </Link>
              </div>
              <input
                value={state.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                className="mb-4 w-full border-none bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-[var(--text-muted)] md:text-4xl"
                style={{ color: "var(--text-primary)" }}
                placeholder="Name your project"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={state.category}
                  onChange={(e) => setField("category", e.target.value)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium outline-none"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                    color: "var(--accent-strong)",
                  }}
                >
                  {state.stage}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    urg.tone === "critical"
                      ? "bg-red-500/15 text-red-700 dark:text-red-300"
                      : urg.tone === "soon"
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                        : "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {urg.label}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                  <div className="section-meta text-[10px] uppercase tracking-wider">Overall completion</div>
                  <div className="mt-1 text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {overall}%
                  </div>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                  <div className="section-meta text-[10px] uppercase tracking-wider">Submission / event</div>
                  <input
                    type="date"
                    value={state.eventDeadline}
                    onChange={(e) => setField("eventDeadline", e.target.value)}
                    className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                    style={{ borderColor: "var(--border-strong)", background: "var(--bg-muted)", color: "var(--text-primary)" }}
                  />
                  {dLeft !== null ? (
                    <div className="section-meta mt-2">{dLeft >= 0 ? `${dLeft} days left` : `${Math.abs(dLeft)} days overdue`}</div>
                  ) : null}
                </div>
                <div className="rounded-xl border p-4 sm:col-span-2 lg:col-span-1" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                  <div className="section-meta text-[10px] uppercase tracking-wider">Timeline (weeks)</div>
                  <input
                    type="number"
                    min={1}
                    max={104}
                    value={state.durationWeeks}
                    onChange={(e) => setField("durationWeeks", Math.max(1, Number(e.target.value) || 1))}
                    className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                    style={{ borderColor: "var(--border-strong)", background: "var(--bg-muted)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={addSnapshot} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
                  Add progress snapshot
                </button>
                <button type="button" onClick={addTask} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
                  Add task
                </button>
                <button type="button" onClick={addMilestone} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
                  Update / add milestone
                </button>
                <button type="button" onClick={bumpWeekHours} className="btn-ghost rounded-xl px-4 py-2.5 text-sm">
                  +1 hr this week
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 lg:items-end">
              <div className="relative">
                <Ring pct={overall} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {overall}%
                  </span>
                  <span className="section-meta text-[10px] uppercase">Done</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap bar */}
          <div className="relative mt-10">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              <span>Roadmap</span>
              <span>Stage {stageIdx + 1} / {STAGES.length}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
              {STAGES.map((st, i) => {
                const active = i <= stageIdx;
                const isCurrent = i === stageIdx;
                return (
                  <div
                    key={st}
                    title={st}
                    className="h-full flex-1 border-r border-[var(--bg-elevated)]/30 transition-all duration-500 last:border-0"
                    style={{
                      background: active ? "color-mix(in oklab, var(--accent) 85%, black)" : "transparent",
                      opacity: isCurrent ? 1 : active ? 0.65 : 0.35,
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
              {STAGES.map((st) => (
                <span key={st} className="flex-1 truncate text-center">
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="section-meta mb-1 block text-[10px] uppercase tracking-wider">Current stage</label>
            <select
              value={state.stage}
              onChange={(e) => setField("stage", e.target.value)}
              className="w-full max-w-md rounded-xl border px-3 py-2 text-sm font-medium outline-none"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            >
              {STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Milestones */}
        <section ref={milestonesRef} className="mt-12 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Milestone tracker
              </h2>
              <p className="section-meta mt-1 max-w-2xl">
                Major checkpoints from idea to submission—link tasks and log evidence as you go.
              </p>
            </div>
            <button type="button" onClick={addMilestone} className="btn-secondary rounded-xl text-sm">
              + Milestone
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.milestones.length === 0 ? (
              <div className="panel rounded-2xl p-8 text-center section-meta md:col-span-2">Add milestones to structure your build.</div>
            ) : (
              state.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`panel group rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${highlight === m.id ? "ring-2 ring-[var(--accent)]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <input
                      value={m.title}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)),
                        }))
                      }
                      className="flex-1 border-none bg-transparent text-base font-semibold outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                    <MiniRing pct={m.completionPct} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="section-meta text-[10px] uppercase">Due</label>
                      <input
                        type="date"
                        value={m.dueDate ? m.dueDate.slice(0, 10) : ""}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, dueDate: e.target.value } : x)),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1 text-xs outline-none"
                        style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
                      />
                    </div>
                    <div>
                      <label className="section-meta text-[10px] uppercase">Status</label>
                      <select
                        value={m.status}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            milestones: s.milestones.map((x) =>
                              x.id === m.id
                                ? {
                                    ...x,
                                    status: e.target.value as Milestone["status"],
                                    completionPct: e.target.value === "done" ? 100 : x.completionPct,
                                  }
                                : x,
                            ),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1 text-xs outline-none"
                        style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="section-meta text-[10px] uppercase">Completion</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={m.completionPct}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, completionPct: Number(e.target.value) } : x)),
                        }))
                      }
                      className="mt-1 w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`ev-${m.id}`}
                      checked={m.evidenceUploaded}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, evidenceUploaded: e.target.checked } : x)),
                        }))
                      }
                    />
                    <label htmlFor={`ev-${m.id}`} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Evidence uploaded (log, photos, repo link…)
                    </label>
                  </div>
                  <textarea
                    value={m.notes}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        milestones: s.milestones.map((x) => (x.id === m.id ? { ...x, notes: e.target.value } : x)),
                      }))
                    }
                    placeholder="Notes…"
                    rows={2}
                    className="mt-3 w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none"
                    style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
                  />
                  <button
                    type="button"
                    className="section-meta mt-2 text-[10px] hover:underline"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        milestones: s.milestones.filter((x) => x.id !== m.id),
                      }))
                    }
                  >
                    Remove milestone
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Tasks */}
        <section ref={tasksRef} className="mt-14 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Tasks
              </h2>
              <p className="section-meta mt-1">Checklist, Kanban, or weekly planner—same tasks, your view.</p>
            </div>
            <div className="flex rounded-xl border p-1" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
              {(
                [
                  ["checklist", "Checklist"],
                  ["kanban", "Kanban"],
                  ["planner", "Weekly"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTaskView(k)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${taskView === k ? "shadow-sm" : ""}`}
                  style={{
                    background: taskView === k ? "var(--bg-elevated)" : "transparent",
                    color: "var(--text-primary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {taskView === "checklist" && (
            <div className="space-y-3">
              {state.tasks.map((t) => (
                <TaskCard key={t.id} t={t} setState={setState} highlight={highlight === t.id} />
              ))}
              {state.tasks.length === 0 ? <div className="panel rounded-2xl p-8 text-center section-meta">No tasks—add one from the hero.</div> : null}
            </div>
          )}

          {taskView === "kanban" && (
            <div className="grid gap-4 md:grid-cols-3">
              {(["backlog", "doing", "done"] as const).map((col) => (
                <div key={col} className="rounded-2xl border p-3" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {col}
                  </div>
                  <div className="space-y-3">
                    {state.tasks
                      .filter((t) => t.column === col)
                      .map((t) => (
                        <TaskCard key={t.id} t={t} setState={setState} compact highlight={highlight === t.id} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {taskView === "planner" && (
            <PlannerView tasks={state.tasks} setState={setState} highlight={highlight} />
          )}
        </section>

        {/* Timeline */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Timeline & deadlines
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="panel rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Countdown
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {dLeft !== null ? (dLeft >= 0 ? dLeft : 0) : "—"}
              </div>
              <div className="section-meta">days to submission / event</div>
            </div>
            <div className="panel rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Pace
              </div>
              <div className="mt-2 text-lg font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                {pace.replace("_", " ")}
              </div>
              <div className="section-meta mt-1">
                {projected ? `Projected wrap: ${projected.toLocaleDateString()}` : "Add deadline + tasks for a projection."}
              </div>
            </div>
            <div className="panel rounded-2xl p-5 lg:col-span-2">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Upcoming deadlines
              </div>
              <ul className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <li className="section-meta">No upcoming dated tasks.</li>
                ) : (
                  upcomingTasks.map((t) => (
                    <li key={t.id} className="flex justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span>{t.title}</span>
                      <span className="section-meta">{t.dueDate}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="panel rounded-2xl p-5 lg:col-span-2">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--danger)" }}>
                Overdue
              </div>
              <ul className="space-y-2">
                {overdueTasks.length === 0 ? (
                  <li className="section-meta">None—nice.</li>
                ) : (
                  overdueTasks.map((t) => (
                    <li key={t.id} className="flex justify-between text-sm" style={{ color: "var(--danger)" }}>
                      <span>{t.title}</span>
                      <span>{t.dueDate}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Progress analytics
          </h2>
          <p className="section-meta mt-1 mb-6">Planned vs actual, milestones, rhythm—built from your data.</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-2xl p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Planned vs actual (overall %)
              </div>
              <LineChart planned={plannedLine} actual={actualLine} />
              <p className="section-meta mt-2 text-center">Dashed = ideal linear ramp · Solid = snapshots & momentum</p>
            </div>

            <div className="panel rounded-2xl p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Stage emphasis (by milestone avg)
              </div>
              <div className="space-y-3">
                {STAGES.map((st, i) => {
                  let pct = 0;
                  if (i < stageIdx) pct = 100;
                  else if (i === stageIdx) pct = state.milestones.length ? milestoneAvgPct(state.milestones) : overall;
                  else pct = 0;
                  return (
                    <div key={st}>
                      <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span>{st}</span>
                        <span className="tabular-nums">{Math.min(100, Math.round(pct))}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            background: "color-mix(in oklab, var(--accent) 80%, white)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel rounded-2xl p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Milestone status
              </div>
              <MilestoneDonutVisual segments={milestoneDonut} />
            </div>

            <div className="panel rounded-2xl p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Weekly productivity (self-logged hours)
              </div>
              <div className="flex h-44 items-end justify-between gap-1.5">
                {weeklyBars.length === 0 ? (
                  <span className="section-meta">Use “+1 hr this week” to build this chart.</span>
                ) : (
                  weeklyBars.map((b) => (
                    <div key={b.key} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className="w-full max-w-8 rounded-t-md transition-all duration-500"
                        style={{
                          height: `${Math.max(8, Math.round((b.pct / 100) * 132))}px`,
                          background: "color-mix(in oklab, var(--accent) 72%, transparent)",
                        }}
                      />
                      <span className="section-meta max-w-full truncate text-center text-[9px] leading-tight">
                        {b.key.replace("-W", " · W")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel rounded-2xl p-5 lg:col-span-2">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Blockers & risks
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue task(s)—consider cutting scope or pushing milestone dates.`
                  : pace === "behind"
                    ? "Velocity suggests finishing after your target—add snapshots weekly to track recovery."
                    : pace === "ahead"
                      ? "You’re ahead of the linear plan—good time to document evidence and polish the story."
                      : "No red flags from pace and deadlines. Keep logging weekly hours."}
              </p>
            </div>
          </div>
        </section>

        <p className="section-meta mt-12 text-center">Saved locally in this browser · {STORAGE_KEY}</p>
      </div>
    </div>
  );
}

function PlannerView({
  tasks,
  setState,
  highlight,
}: {
  tasks: Task[];
  setState: React.Dispatch<React.SetStateAction<ProjectProgressState>>;
  highlight: string | null;
}) {
  const groups = React.useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      const d = parseDate(t.dueDate);
      const k = d ? isoWeekKey(d) : "Unscheduled";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  if (!tasks.length) {
    return <div className="panel rounded-2xl p-8 text-center section-meta">Add tasks to see them grouped by week.</div>;
  }

  return (
    <div className="space-y-10">
      {groups.map(([wk, list]) => (
        <div key={wk}>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: "var(--border-soft)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              {wk}
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border-soft)" }} />
          </div>
          <div className="space-y-3">
            {list.map((t) => (
              <TaskCard key={t.id} t={t} setState={setState} compact highlight={highlight === t.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({
  t,
  setState,
  compact,
  highlight,
}: {
  t: Task;
  setState: React.Dispatch<React.SetStateAction<ProjectProgressState>>;
  compact?: boolean;
  highlight?: boolean;
}) {
  const update = (patch: Partial<Task>) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, ...patch } : x)),
    }));

  return (
    <div
      className={`panel rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${highlight ? "ring-2 ring-[var(--accent)]" : ""} ${compact ? "" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <input
          value={t.title}
          onChange={(e) => update({ title: e.target.value })}
          className="min-w-0 flex-1 border-none bg-transparent font-semibold outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityStyle[t.priority]}`}>{t.priority}</span>
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        <Field label="Due" small>
          <input
            type="date"
            value={t.dueDate ? t.dueDate.slice(0, 10) : ""}
            onChange={(e) => update({ dueDate: e.target.value })}
            className="input-base w-full py-1.5 text-xs"
          />
        </Field>
        <Field label="Est / actual hrs" small>
          <div className="flex gap-1">
            <input
              type="number"
              min={0}
              step={0.5}
              value={t.estHours}
              onChange={(e) => update({ estHours: Number(e.target.value) })}
              className="input-base w-16 py-1.5 text-xs"
            />
            <input
              type="number"
              min={0}
              step={0.5}
              value={t.actualHours}
              onChange={(e) => update({ actualHours: Number(e.target.value) })}
              className="input-base w-16 py-1.5 text-xs"
            />
          </div>
        </Field>
        <Field label="Owner" small>
          <input
            value={t.owner}
            onChange={(e) => update({ owner: e.target.value })}
            placeholder="You / teammate"
            className="input-base w-full py-1.5 text-xs"
          />
        </Field>
        <Field label="Dependencies" small>
          <input
            value={t.dependencies}
            onChange={(e) => update({ dependencies: e.target.value })}
            placeholder="Task IDs or names"
            className="input-base w-full py-1.5 text-xs"
          />
        </Field>
        <Field label="Attachments" small>
          <input
            value={t.attachments}
            onChange={(e) => update({ attachments: e.target.value })}
            placeholder="Links / files"
            className="input-base w-full py-1.5 text-xs"
          />
        </Field>
        <Field label="Column" small>
          <select value={t.column} onChange={(e) => update({ column: e.target.value as Task["column"] })} className="input-base w-full py-1.5 text-xs">
            <option value="backlog">backlog</option>
            <option value="doing">doing</option>
            <option value="done">done</option>
          </select>
        </Field>
        <Field label="Priority" small>
          <select value={t.priority} onChange={(e) => update({ priority: e.target.value as TaskPriority })} className="input-base w-full py-1.5 text-xs">
            <option value="low">low</option>
            <option value="med">med</option>
            <option value="high">high</option>
          </select>
        </Field>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <input type="checkbox" checked={t.done} onChange={(e) => update({ done: e.target.checked, column: e.target.checked ? "done" : t.column })} />
        Mark complete
      </label>
      <textarea
        value={t.notes}
        onChange={(e) => update({ notes: e.target.value })}
        placeholder="Notes…"
        rows={compact ? 2 : 3}
        className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none"
        style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
      />
      <button
        type="button"
        className="section-meta mt-2 text-[10px] hover:underline"
        onClick={() => setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== t.id) }))}
      >
        Remove task
      </button>
    </div>
  );
}

function Field({ label, children, small }: { label: string; children: React.ReactNode; small?: boolean }) {
  return (
    <div>
      <div className={`font-medium uppercase tracking-wider ${small ? "text-[9px]" : "text-[10px] section-meta"}`} style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
