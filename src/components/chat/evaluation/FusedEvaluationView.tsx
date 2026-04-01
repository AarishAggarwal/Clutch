"use client";

import type { FusedEvaluationMode } from "@/lib/types";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import ExpandableSection from "@/components/chat/ExpandableSection";
import RubricGrid from "@/components/chat/evaluation/RubricGrid";

type ProviderResult = {
  modelName: string;
  parsedJson: ModelEvaluationJson;
  rawJson?: unknown;
};

export default function FusedEvaluationView(props: {
  mode: FusedEvaluationMode;
  fusedJson: ModelEvaluationJson;
  agreementSummary: string;
  disagreementFlags: unknown;
  openaiResult?: ProviderResult;
  claudeResult?: ProviderResult;
}) {
  const { mode, fusedJson, agreementSummary, disagreementFlags } = props;

  const discrepancyList = Array.isArray(disagreementFlags) ? disagreementFlags : [];

  return (
    <div className="space-y-4">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="kpi-label">Essay review</span>
              <span className="badge-neutral capitalize">
                {mode === "dual-model" ? "Full calibration" : "Standard"}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <div className="text-5xl font-semibold tracking-tight tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fusedJson.overall_score}
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                / 100 overall
              </div>
            </div>
          </div>

          <div className="max-w-xl text-sm leading-relaxed lg:text-right" style={{ color: "var(--text-secondary)" }}>
            {fusedJson.essay_summary}
          </div>
        </div>

        <div className="mt-6">
          <RubricGrid evaluation={fusedJson} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="panel-muted p-4">
            <div className="section-heading">Strengths</div>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {fusedJson.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="panel-muted p-4">
            <div className="section-heading">Gaps to address</div>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {fusedJson.weaknesses.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <ExpandableSection title="Paragraph feedback" defaultOpen>
            <div className="space-y-3">
              {fusedJson.paragraph_feedback.map((p) => (
                <div key={p.paragraph_number} className="panel-muted p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Paragraph {p.paragraph_number}
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {p.feedback}
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>

        <div className="mt-3">
          <ExpandableSection title="Sentence-level edits" defaultOpen={false}>
            <div className="space-y-2">
              {fusedJson.sentence_level_edits.map((e, idx) => (
                <div key={idx} className="panel-muted p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Edit {idx + 1}
                  </div>
                  <div className="mt-2 text-sm">
                    <div style={{ color: "var(--text-muted)" }}>Original</div>
                    <div
                      className="mt-1 whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                    >
                      {e.original}
                    </div>
                    <div className="mt-2" style={{ color: "var(--text-muted)" }}>
                      Suggestion
                    </div>
                    <div
                      className="mt-1 whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                    >
                      {e.suggestion}
                    </div>
                    <div className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Why: {e.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>

        <div className="mt-3">
          <ExpandableSection title="Revision plan" defaultOpen={false}>
            <ol className="list-decimal space-y-2 pl-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {fusedJson.revision_plan.map((p, idx) => (
                <li key={idx} className="leading-relaxed">
                  {p}
                </li>
              ))}
            </ol>
          </ExpandableSection>
        </div>

        <div className="panel-muted mt-5 p-4">
          <div className="section-heading">Final verdict</div>
          <div className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {fusedJson.final_verdict}
          </div>
        </div>
      </div>

      <div>
        <ExpandableSection title="Calibration notes" defaultOpen={false}>
          <div className="space-y-3">
            <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {agreementSummary}
            </div>
            {discrepancyList.length > 0 ? (
              <div className="space-y-2">
                <div className="kpi-label">Dimension variance</div>
                {discrepancyList.map((f: any, idx: number) => (
                  <div key={idx} className="panel-muted p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                        {String(f.dimension).replaceAll("_", " ")}
                      </div>
                      <div className="section-meta">Δ {String(f.diff)}</div>
                    </div>
                    <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      Scores: {String(f.openaiScore)} vs {String(f.claudeScore)}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {String(f.note)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                No major scorer disagreement on this draft.
              </div>
            )}
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
}
