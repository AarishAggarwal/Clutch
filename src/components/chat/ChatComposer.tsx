"use client";

import * as React from "react";
import { essayTypes, type EssayType } from "@/lib/types";
import { supplementalUniversities } from "@/lib/supplementalPrompts";

export default function ChatComposer(props: {
  essayType: EssayType;
  onEssayTypeChange: (t: EssayType) => void;
  essayText: string;
  onEssayTextChange: (t: string) => void;
  essayTitle?: string;
  onEssayTitleChange?: (t: string) => void;
  supplementalUniversityId?: string;
  onSupplementalUniversityIdChange?: (id: string) => void;
  supplementalPromptId?: string;
  onSupplementalPromptIdChange?: (id: string) => void;
  isSubmitting: boolean;
  disabledReason?: string;
  onSubmit: () => void;
}) {
  const {
    essayType,
    onEssayTypeChange,
    essayText,
    onEssayTextChange,
    essayTitle,
    onEssayTitleChange,
    supplementalUniversityId,
    onSupplementalUniversityIdChange,
    supplementalPromptId,
    onSupplementalPromptIdChange,
    isSubmitting,
    disabledReason,
    onSubmit,
  } = props;

  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isSupplemental = essayType === "supplemental_essay";
  const selectedUniversity = supplementalUniversities.find((u) => u.id === supplementalUniversityId);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isSubmitting) onSubmit();
    }
  }

  return (
    <div className="chat-composer-surface sticky bottom-0 z-10 border-t">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-[14rem] sm:max-w-[16rem]">
                <label className="field-label">Essay type</label>
                <select
                  value={essayType}
                  onChange={(e) => onEssayTypeChange(e.target.value as EssayType)}
                  disabled={isSubmitting}
                  className="input-base disabled:opacity-55"
                >
                  {essayTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {isSupplemental ? (
                <>
                  <div className="min-w-[14rem] flex-1">
                    <label className="field-label">University</label>
                    <select
                      value={supplementalUniversityId ?? ""}
                      onChange={(e) => onSupplementalUniversityIdChange?.(e.target.value)}
                      disabled={isSubmitting}
                      className="input-base disabled:opacity-55"
                    >
                      <option value="">Select a university</option>
                      {supplementalUniversities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[14rem] flex-[1.25]">
                    <label className="field-label">Prompt</label>
                    <select
                      value={supplementalPromptId ?? ""}
                      onChange={(e) => onSupplementalPromptIdChange?.(e.target.value)}
                      disabled={isSubmitting || !selectedUniversity}
                      className="input-base disabled:opacity-55"
                    >
                      <option value="">{selectedUniversity ? "Select a prompt" : "Select university first"}</option>
                      {(selectedUniversity?.prompts ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.cycleYear}] {p.question}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : onEssayTitleChange ? (
                <div className="min-w-[14rem] flex-1">
                  <label className="field-label">Title (optional)</label>
                  <input
                    value={essayTitle ?? ""}
                    onChange={(e) => onEssayTitleChange(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Draft label for your records"
                    className="input-base disabled:opacity-55"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden max-w-xs text-right text-xs lg:block" style={{ color: "var(--text-muted)" }}>
                {disabledReason ?? (
                  <>
                    Submit · <span className="font-medium" style={{ color: "var(--text-secondary)" }}>⌘/Ctrl + Enter</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) onSubmit();
                  textAreaRef.current?.focus();
                }}
                disabled={isSubmitting}
                className="btn-primary px-5 disabled:opacity-55"
              >
                {isSubmitting ? "Reviewing…" : "Get feedback"}
              </button>
            </div>
          </div>

          <div className="panel p-3 sm:p-4">
            <label className="field-label">Essay text</label>
            <textarea
              ref={textAreaRef}
              value={essayText}
              onChange={(e) => onEssayTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Paste your essay. What you submit is used only to build this review."
              className="mt-1 min-h-[5.5rem] w-full resize-y border-0 bg-transparent px-0 py-1 text-sm leading-relaxed outline-none disabled:opacity-55"
              style={{ color: "var(--text-primary)" }}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
              <span className="tabular-nums">
                {essayText.trim().length > 0 ? `${essayText.trim().length} characters` : "\u00a0"}
              </span>
              <span className="hidden sm:inline">Local-only prototype—content stays in your workspace.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
