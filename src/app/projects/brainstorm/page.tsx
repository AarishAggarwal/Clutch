"use client";

import * as React from "react";

const STORAGE = "projectBrainstorm:v2";

type PromptCard = {
  id: string;
  icon: string;
  question: string;
  helper: string;
  placeholder: string;
};

const PROMPTS: PromptCard[] = [
  {
    id: "problem",
    icon: "!",
    question: "What problem do you want to solve?",
    helper:
      "Describe the issue clearly and specifically. What is frustrating, inefficient, unsafe, or missing?",
    placeholder: "Write the exact pain point in concrete terms...",
  },
  {
    id: "who",
    icon: "U",
    question: "Who faces this problem the most?",
    helper:
      "Think about the exact group of people affected - students, farmers, teachers, patients, commuters, small businesses, etc.",
    placeholder: "Who are the primary users or people affected?",
  },
  {
    id: "why",
    icon: "*",
    question: "Why is this problem important to solve?",
    helper:
      "Explain the real-world impact. What happens if this problem continues?",
    placeholder: "Why does this matter now? What are the consequences?",
  },
  {
    id: "solution",
    icon: "+",
    question: "What is your proposed solution?",
    helper:
      "Describe your idea simply. What would you build, create, or introduce?",
    placeholder: "Describe your solution in plain language...",
  },
  {
    id: "unique",
    icon: "#",
    question: "What makes your idea unique or better than existing solutions?",
    helper:
      "Think about innovation, accessibility, affordability, speed, usability, or impact.",
    placeholder: "What is your real differentiator?",
  },
  {
    id: "workflow",
    icon: ">",
    question: "How would your project actually work in real life?",
    helper:
      "Walk through the process, system, or user experience step by step.",
    placeholder: "Explain the workflow from start to finish...",
  },
  {
    id: "resources",
    icon: "@",
    question: "What resources, tools, or skills would you need?",
    helper:
      "Think about software, hardware, datasets, mentors, materials, team members, budget, or knowledge.",
    placeholder: "List tools, platforms, people, and skills required...",
  },
  {
    id: "challenges",
    icon: "?",
    question: "What challenges or risks do you expect?",
    helper:
      "Be honest. What could go wrong or make this difficult?",
    placeholder: "Name technical, time, adoption, and execution risks...",
  },
  {
    id: "impact_next",
    icon: "^",
    question: "What impact could this project have, and what should your first next step be?",
    helper:
      "Think about who benefits, how meaningful it could be, and what you should do first to begin.",
    placeholder: "Describe intended impact and your immediate next action...",
  },
];

const ACTION_CHIPS = [
  "AI hint",
  "Expand answer",
  "Voice note",
  "Attach link",
  "Mark done",
];

export default function ProjectBrainstormPage() {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [focusedCard, setFocusedCard] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [savingPulse, setSavingPulse] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        setAnswers(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE, JSON.stringify(answers));
    setSavedAt(new Date());
    setSavingPulse(true);
    const timer = window.setTimeout(() => setSavingPulse(false), 500);
    return () => window.clearTimeout(timer);
  }, [answers, hydrated]);

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function countWords(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  const completed = PROMPTS.filter((p) => (answers[p.id] ?? "").trim().length > 0).length;
  const completionPct = Math.round((completed / PROMPTS.length) * 100);

  const summaryPreview = PROMPTS.filter((p) => (answers[p.id] ?? "").trim()).map((p) => ({
    title: p.question,
    value: answers[p.id].trim(),
  }));

  function autosaveLabel() {
    if (!savedAt) return "Autosave ready";
    const now = Date.now();
    const delta = Math.floor((now - savedAt.getTime()) / 1000);
    if (delta < 5) return "Saved just now";
    if (delta < 60) return `Saved ${delta}s ago`;
    const min = Math.floor(delta / 60);
    return `Saved ${min}m ago`;
  }

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="section-meta">Loading brainstorm studio...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      <div className="page-wrap py-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] sm:p-8"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "color-mix(in oklab, var(--accent) 30%, transparent)", opacity: 0.5 }}
          />
          <div className="relative">
            <div className="mb-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
              Creative project thinking studio
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Brainstorm Your Project
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Turn a rough idea into a real, buildable project.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--bg-muted) 88%, white)" }}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Progress
                </div>
                <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {completed} of {PROMPTS.length} questions completed
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completionPct}%`,
                      background: "linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 58%, #7c3aed))",
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <button type="button" className="btn-secondary text-sm">
                  Save draft
                </button>
                <button type="button" className="btn-secondary text-sm">
                  Continue later
                </button>
                <button type="button" className="btn-primary text-sm">
                  Generate My Project Plan
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs transition-opacity" style={{ color: "var(--text-muted)", opacity: savingPulse ? 1 : 0.85 }}>
              {autosaveLabel()}
            </div>
          </div>
        </section>

        <div
          className="sticky top-[4.25rem] z-30 mt-6 rounded-xl border px-4 py-2 backdrop-blur"
          style={{
            borderColor: "var(--border-soft)",
            background: "color-mix(in oklab, var(--bg-elevated) 90%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Workbook progress
            </div>
            <div className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              {completionPct}%
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: "var(--accent)",
              }}
            />
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROMPTS.map((card, idx) => {
            const value = answers[card.id] ?? "";
            const done = value.trim().length > 0;
            const words = countWords(value);
            return (
              <article
                key={card.id}
                className={[
                  "group relative overflow-hidden rounded-2xl border p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_36px_-20px_rgba(15,23,42,0.35)]",
                  idx % 2 === 0 ? "sm:translate-y-0" : "sm:translate-y-2",
                ].join(" ")}
                style={{
                  borderColor: focusedCard === card.id ? "var(--accent)" : "var(--border-soft)",
                  background:
                    focusedCard === card.id
                      ? "color-mix(in oklab, var(--accent) 7%, var(--bg-elevated))"
                      : "color-mix(in oklab, var(--bg-elevated) 90%, #f8f5ef)",
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold"
                      style={{
                        borderColor: done ? "color-mix(in oklab, var(--accent) 40%, var(--border-soft))" : "var(--border-soft)",
                        color: done ? "var(--accent-strong)" : "var(--text-muted)",
                        background: done ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--bg-elevated)",
                      }}
                    >
                      {done ? "✓" : card.icon}
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                        {card.question}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {card.helper}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {words}w
                  </span>
                </div>

                <textarea
                  value={value}
                  onChange={(e) => updateAnswer(card.id, e.target.value)}
                  onFocus={() => setFocusedCard(card.id)}
                  onBlur={() => setFocusedCard(null)}
                  placeholder={card.placeholder}
                  rows={7}
                  className="w-full resize-y rounded-xl border px-3 py-3 text-sm leading-relaxed outline-none transition-all"
                  style={{
                    borderColor:
                      focusedCard === card.id ? "color-mix(in oklab, var(--accent) 50%, var(--border-soft))" : "var(--border-soft)",
                    background:
                      "repeating-linear-gradient(to bottom, color-mix(in oklab, var(--bg-elevated) 97%, #f7f4ec) 0, color-mix(in oklab, var(--bg-elevated) 97%, #f7f4ec) 27px, color-mix(in oklab, var(--border-soft) 35%, transparent) 28px)",
                    color: "var(--text-secondary)",
                    boxShadow:
                      focusedCard === card.id
                        ? "0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)"
                        : "none",
                  }}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {ACTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="rounded-full border px-2 py-1 text-[10px] font-medium transition hover:opacity-85"
                        style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: done ? "var(--accent-strong)" : "var(--text-muted)" }}>
                    {done ? "Completed" : "In progress"}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section
          className="mt-8 rounded-2xl border p-6 shadow-[0_14px_36px_-26px_rgba(15,23,42,0.3)] sm:p-8"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
        >
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            You have completed {completed} of {PROMPTS.length} brainstorm questions
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Great momentum. You are converting abstract ideas into a real execution path.
          </p>

          <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Summary preview
            </div>
            {summaryPreview.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Start answering cards above to generate a summary preview.
              </p>
            ) : (
              <div className="space-y-3">
                {summaryPreview.slice(0, 4).map((item) => (
                  <div key={item.title} className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {item.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-primary">
              Turn This Into a Project Plan
            </button>
            <button type="button" className="btn-secondary">
              Save and Continue Later
            </button>
            <button type="button" className="btn-ghost">
              Edit Answers
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
