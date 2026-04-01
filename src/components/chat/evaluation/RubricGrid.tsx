"use client";

import type { ModelEvaluationJson } from "@/lib/evaluationSchema";

export default function RubricGrid(props: { evaluation: ModelEvaluationJson }) {
  const { evaluation } = props;
  const scores = evaluation.rubric_scores;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {scores.map((s) => (
        <div key={s.dimension} className="panel-muted p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {s.dimension.replaceAll("_", " ")}
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {s.score}
                <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                  {" "}
                  / 10
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {s.reason}
          </p>
        </div>
      ))}
    </div>
  );
}
