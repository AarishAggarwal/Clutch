"use client";

import * as React from "react";
import type { SupplementalPrompt } from "@/lib/types";
import MaterialIcon from "@/components/shell/MaterialIcon";

type Props = {
  prompts: SupplementalPrompt[];
  value: string;
  onChange: (promptId: string) => void;
  disabled?: boolean;
};

function promptPreview(question: string, max = 72) {
  const flat = question.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export default function PromptSelect({ prompts, value, onChange, disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = prompts.find((p) => p.id === value);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || !prompts.length}
        onClick={() => setOpen((v) => !v)}
        className={[
          "input-base flex w-full items-center justify-between gap-2 !py-2.5 !text-left !text-sm",
          disabled || !prompts.length ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? promptPreview(selected.question) : "Select prompt"}
        </span>
        <MaterialIcon name={open ? "expand_less" : "expand_more"} className="shrink-0 !text-base text-text-muted" />
      </button>

      {open && prompts.length > 0 ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-72 w-[min(22rem,calc(100vw-14rem))] overflow-y-auto rounded-lg border border-border-subtle bg-elevated shadow-elevated"
        >
          {prompts.map((p) => {
            const isSelected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className={[
                  "block w-full border-b border-border-subtle px-3 py-2.5 text-left text-xs leading-relaxed transition last:border-b-0",
                  isSelected
                    ? "bg-primary/8 text-text-primary"
                    : "text-text-secondary hover:bg-surface-container-high hover:text-text-primary",
                ].join(" ")}
              >
                {p.wordLimit ? (
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {p.wordLimit}
                    {p.kind ? ` · ${p.kind.replace(/_/g, " ")}` : ""}
                  </span>
                ) : null}
                <span className="whitespace-pre-wrap text-sm">{p.question}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
