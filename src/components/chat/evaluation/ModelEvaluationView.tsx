"use client";

import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import RubricGrid from "@/components/chat/evaluation/RubricGrid";

export default function ModelEvaluationView(props: {
  title: string;
  evaluation: ModelEvaluationJson;
  compact?: boolean;
}) {
  const { title, evaluation } = props;

  if (!evaluation) return null;

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="section-heading">{title}</div>
          <div className="section-meta mt-1">
            Overall ·{" "}
            <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {evaluation.overall_score}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {evaluation.essay_summary}
      </div>

      <div className="mt-4">
        <RubricGrid evaluation={evaluation} />
      </div>
    </div>
  );
}
