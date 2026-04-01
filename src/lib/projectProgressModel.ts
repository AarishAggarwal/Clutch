/** High school project tracker — persisted in localStorage */

export const STORAGE_KEY = "projectProgress:v2";

export const CATEGORIES = [
  "Research",
  "App / CS",
  "Robotics",
  "Science fair",
  "Hackathon",
  "Social impact",
  "Other",
] as const;

export const STAGES = ["Ideation", "Planning", "Building", "Launch", "Reflection"] as const;

export type Milestone = {
  id: string;
  title: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "done";
  completionPct: number;
  linkedTaskIds: string[];
  evidenceUploaded: boolean;
  notes: string;
};

export type TaskPriority = "low" | "med" | "high";

export type Task = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  estHours: number;
  actualHours: number;
  owner: string;
  dependencies: string;
  attachments: string;
  notes: string;
  done: boolean;
  column: "backlog" | "doing" | "done";
};

export type ProgressSnapshot = {
  at: string;
  pct: number;
};

export type ProjectProgressState = {
  projectName: string;
  category: string;
  stage: string;
  durationWeeks: number;
  eventDeadline: string;
  milestones: Milestone[];
  tasks: Task[];
  progressSnapshots: ProgressSnapshot[];
  weeklyProductivity: Record<string, number>;
};

export const defaultState = (): ProjectProgressState => ({
  projectName: "Untitled innovation project",
  category: "Research",
  stage: "Ideation",
  durationWeeks: 10,
  eventDeadline: "",
  milestones: [],
  tasks: [],
  progressSnapshots: [],
  weeklyProductivity: {},
});

export function migrateState(raw: unknown): ProjectProgressState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  if (o.projectName != null && typeof o.projectName === "string") base.projectName = o.projectName;
  if (o.category != null && typeof o.category === "string") base.category = o.category;
  if (o.stage != null && typeof o.stage === "string") base.stage = o.stage;
  if (typeof o.durationWeeks === "number") base.durationWeeks = o.durationWeeks;
  if (typeof o.eventDeadline === "string") base.eventDeadline = o.eventDeadline;

  if (Array.isArray(o.milestones)) {
    base.milestones = o.milestones
      .filter((m): m is Record<string, unknown> => m != null && typeof m === "object")
      .map((m) => ({
        id: String(m.id ?? `m-${Date.now()}`),
        title: String(m.title ?? "Milestone"),
        dueDate: String(m.dueDate ?? ""),
        status: (["not_started", "in_progress", "done"].includes(m.status as string) ? m.status : "not_started") as Milestone["status"],
        completionPct: typeof m.completionPct === "number" ? m.completionPct : 0,
        linkedTaskIds: Array.isArray(m.linkedTaskIds) ? (m.linkedTaskIds as string[]) : [],
        evidenceUploaded: Boolean(m.evidenceUploaded),
        notes: String(m.notes ?? ""),
      }));
  }

  if (Array.isArray(o.tasks)) {
    base.tasks = o.tasks.map((t) => {
      if (!t || typeof t !== "object") return null;
      const x = t as Record<string, unknown>;
      return {
        id: String(x.id ?? `t-${Date.now()}`),
        title: String(x.title ?? ""),
        priority: (["low", "med", "high"].includes(x.priority as string) ? x.priority : "med") as TaskPriority,
        dueDate: String(x.dueDate ?? ""),
        estHours: Number(x.estHours) || 0,
        actualHours: Number(x.actualHours) || 0,
        owner: String(x.owner ?? ""),
        dependencies: String(x.dependencies ?? ""),
        attachments: String(x.attachments ?? ""),
        notes: String(x.notes ?? ""),
        done: Boolean(x.done),
        column: (["backlog", "doing", "done"].includes(x.column as string) ? x.column : "backlog") as Task["column"],
      } as Task;
    }).filter(Boolean) as Task[];
  }

  if (Array.isArray(o.progressSnapshots)) {
    base.progressSnapshots = o.progressSnapshots.filter(
      (s): s is ProgressSnapshot =>
        s && typeof s === "object" && typeof (s as ProgressSnapshot).at === "string" && typeof (s as ProgressSnapshot).pct === "number",
    );
  }

  if (o.weeklyProductivity && typeof o.weeklyProductivity === "object") {
    base.weeklyProductivity = { ...base.weeklyProductivity, ...(o.weeklyProductivity as Record<string, number>) };
  }

  // v1 migration
  if (base.tasks.length === 0 && Array.isArray((o as { todos?: unknown }).todos)) {
    const todos = (o as { todos: { id: string; label: string; done: boolean }[] }).todos;
    base.tasks = todos.map((td) => ({
      id: td.id,
      title: td.label,
      priority: "med" as const,
      dueDate: "",
      estHours: 1,
      actualHours: 0,
      owner: "",
      dependencies: "",
      attachments: "",
      notes: "",
      done: td.done,
      column: td.done ? ("done" as const) : ("backlog" as const),
    }));
  }

  return base;
}

export function parseDate(s: string): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysUntil(deadline: string): number | null {
  const d = parseDate(deadline);
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (86400000));
}

export function urgencyLabel(days: number | null): { label: string; tone: "calm" | "soon" | "critical" | "none" } {
  if (days === null) return { label: "Set a deadline", tone: "none" };
  if (days < 0) return { label: "Past deadline", tone: "critical" };
  if (days <= 7) return { label: "Critical window", tone: "critical" };
  if (days <= 21) return { label: "Due soon", tone: "soon" };
  return { label: "Steady pace", tone: "calm" };
}

export function taskCompletionPct(tasks: Task[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

export function milestoneAvgPct(milestones: Milestone[]): number {
  if (!milestones.length) return 0;
  return Math.round(milestones.reduce((a, m) => a + m.completionPct, 0) / milestones.length);
}

/** Overall completion: blend milestones + tasks when both exist */
export function overallCompletion(milestones: Milestone[], tasks: Task[]): number {
  const m = milestoneAvgPct(milestones);
  const t = taskCompletionPct(tasks);
  if (!milestones.length && !tasks.length) return 0;
  if (!milestones.length) return t;
  if (!tasks.length) return m;
  return Math.round(m * 0.45 + t * 0.55);
}

export function projectedCompletionDate(
  startWeeks: number,
  overallPct: number,
  eventDeadline: string,
): { projected: Date | null; pace: "ahead" | "on_track" | "behind" } {
  const end = parseDate(eventDeadline);
  if (!end || overallPct <= 0) return { projected: null, pace: "on_track" };
  const start = new Date();
  start.setDate(start.getDate() - (startWeeks * 7 * overallPct) / 100);
  const totalMs = end.getTime() - Date.now();
  const denom = end.getTime() - start.getTime();
  const expectedPct =
    denom <= 0 ? Math.min(100, overallPct) : Math.min(100, Math.max(0, 100 - (totalMs / denom) * 100));
  let pace: "ahead" | "on_track" | "behind" = "on_track";
  if (overallPct > expectedPct + 12) pace = "ahead";
  else if (overallPct < expectedPct - 12) pace = "behind";

  const remaining = 100 - overallPct;
  const rate = overallPct / Math.max(1, startWeeks);
  const weeksLeft = rate > 0 ? remaining / rate : startWeeks;
  const projected = new Date();
  projected.setDate(projected.getDate() + weeksLeft * 7);
  return { projected, pace };
}

export function stageIndex(stage: string): number {
  const i = STAGES.indexOf(stage as (typeof STAGES)[number]);
  return i >= 0 ? i : 0;
}

export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const one = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil(((t.getTime() - one.getTime()) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}
