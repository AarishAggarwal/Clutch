"use client";

import * as React from "react";
import type { ModelEvaluationJson } from "@/lib/evaluationSchema";
import type { FusedEvaluationMode } from "@/lib/types";
import FusedEvaluationView from "@/components/chat/evaluation/FusedEvaluationView";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  messageType: "plain_text" | "essay_submission" | "fused_result" | "model_result" | "meta";
  content: string;
  createdAt: string;
};

function parseFusedPayload(content: string): {
  mode: FusedEvaluationMode;
  fusedJson: ModelEvaluationJson;
  agreementSummary: string;
  disagreementFlags: unknown;
  openaiResult?: any;
  claudeResult?: any;
} | null {
  try {
    const data = JSON.parse(content) as any;
    return data;
  } catch {
    return null;
  }
}

export default function ChatThread(props: {
  messages: ChatMessage[];
  isEvaluating: boolean;
  evaluatingStatusText: string;
}) {
  const { messages, isEvaluating, evaluatingStatusText } = props;
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isEvaluating, evaluatingStatusText]);

  return (
    <div
      className="flex-1 overflow-y-auto px-3 pb-6 pt-6 sm:px-5"
      style={{ scrollBehavior: "smooth", background: "var(--bg-app)" }}
    >
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {messages.map((m) => {
          if (m.messageType === "model_result") return null;

          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div
                  className="w-full max-w-2xl rounded-2xl border px-4 py-3.5 shadow-sm"
                  style={{
                    borderColor: "var(--border-strong)",
                    background: "var(--text-primary)",
                    color: "var(--bg-elevated)",
                  }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Your essay</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                </div>
              </div>
            );
          }

          if (m.role === "assistant") {
            if (m.messageType === "fused_result") {
              const payload = parseFusedPayload(m.content);
              if (!payload) {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="panel w-full max-w-2xl p-4">
                      <div className="section-heading">Review</div>
                      <div className="section-meta mt-2">Malformed review payload—try submitting again.</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex justify-start">
                  <div className="w-full max-w-6xl">
                    <FusedEvaluationView
                      mode={payload.mode}
                      fusedJson={payload.fusedJson}
                      agreementSummary={payload.agreementSummary}
                      disagreementFlags={payload.disagreementFlags}
                      openaiResult={payload.openaiResult}
                      claudeResult={payload.claudeResult}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex justify-start">
                <div className="panel w-full max-w-2xl px-4 py-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    Counselor note
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {m.content}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {isEvaluating ? (
          <div className="flex justify-start">
            <div className="panel-muted flex w-full max-w-md items-start gap-3 px-4 py-3">
              <span
                className="mt-1.5 inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {evaluatingStatusText}
                </div>
                <div className="section-meta mt-1">Synthesizing scores, strengths, and a concrete revision plan.</div>
              </div>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
