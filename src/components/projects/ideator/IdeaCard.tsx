"use client";

import * as React from "react";
import type { ProjectIdea } from "@/lib/projectIdeator/types";

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col rounded-lg border px-2 py-1.5 text-center"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

export default function IdeaCard({
  idea,
  index,
  onSave,
  onToggleFavorite,
  isSaved,
  isFavorite,
}: {
  idea: ProjectIdea;
  index: number;
  onSave: () => void;
  onToggleFavorite: () => void;
  isSaved: boolean;
  isFavorite: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const s = idea.scores;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)] transition-all hover:shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.65)]"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
        style={{
          background: `linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 40%, #6366f1))`,
        }}
      />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: "color-mix(in oklab, var(--accent) 16%, transparent)", color: "var(--accent-strong)" }}
              >
                Idea #{index + 1}
              </span>
              {idea.compositeRank != null ? (
                <span className="section-meta text-[10px]">Rank · {idea.compositeRank}</span>
              ) : null}
            </div>
            <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight sm:text-xl" style={{ color: "var(--text-primary)" }}>
              {idea.title}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {idea.oneLineConcept}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col sm:items-end">
            <ScorePill label="Originality" value={s.originality} />
            <ScorePill label="Admissions" value={s.admissionsImpact} />
            <ScorePill label="Feasible" value={s.feasibility} />
            <ScorePill label="Difficulty" value={s.difficulty} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onSave} disabled={isSaved} className="btn-secondary rounded-lg px-3 py-1.5 text-xs font-semibold">
            {isSaved ? "Saved" : "Save idea"}
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={["rounded-lg border px-3 py-1.5 text-xs font-semibold transition", isFavorite ? "border-[var(--accent)] text-[var(--accent-strong)]" : ""].join(
              " ",
            )}
            style={{ borderColor: isFavorite ? undefined : "var(--border-strong)", color: isFavorite ? undefined : "var(--text-secondary)" }}
          >
            {isFavorite ? "★ Favorited" : "☆ Favorite"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            {open ? "Collapse detail" : "Full breakdown"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Why this is strong
          </div>
          <p className="mt-1.5" style={{ color: "var(--text-secondary)" }}>
            {idea.whyStrong}
          </p>
        </div>

        {open ? (
          <div className="mt-4 space-y-4">
            <Section title="Problem statement" body={idea.problemStatement} />
            <Section title="Solution concept" body={idea.solutionConcept} />
            <Section title="Target users / beneficiaries" body={idea.targetUsers} />
            <Section title="Uniqueness / differentiation" body={idea.uniqueness} />
            <Section title="Skills required" body={idea.skillsRequired} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Execution plan
              </div>
              <Phase label="Phase 1 · Research / validation" text={idea.executionPhases.phase1} />
              <Phase label="Phase 2 · Prototype / build" text={idea.executionPhases.phase2} />
              <Phase label="Phase 3 · Testing / pilot" text={idea.executionPhases.phase3} />
              <Phase label="Phase 4 · Impact / expansion" text={idea.executionPhases.phase4} />
            </div>
            <Section title="Tools / tech stack / resources" body={idea.toolsTechStack} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Section title="Timeline estimate" body={idea.timelineEstimate} small />
              <Section title="Budget estimate" body={idea.budgetEstimate} small />
            </div>
            <Section title="Best fit for" body={idea.bestFitFor} />
            <Section title="How to make it even stronger" body={idea.howToMakeStronger} />
            <Section title="First 7 days — action plan" body={idea.firstSevenDays} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Section({ title, body, small }: { title: string; body: string; small?: boolean }) {
  return (
    <div>
      <div className={`font-bold uppercase tracking-wider ${small ? "text-[9px]" : "text-[10px]"}`} style={{ color: "var(--text-muted)" }}>
        {title}
      </div>
      <p className={`mt-1.5 whitespace-pre-wrap leading-relaxed ${small ? "text-sm" : ""}`} style={{ color: "var(--text-secondary)" }}>
        {body}
      </p>
    </div>
  );
}

function Phase({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-soft)" }}>
      <div className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {text}
      </p>
    </div>
  );
}
