"use client";

import * as React from "react";

export default function ExpandableSection(props: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { title, children, defaultOpen } = props;
  const [open, setOpen] = React.useState(Boolean(defaultOpen));

  return (
    <section className="panel p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="expandable-trigger flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors"
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </span>
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-medium"
          style={{
            borderColor: "var(--border-soft)",
            background: "var(--bg-muted)",
            color: "var(--text-secondary)",
          }}
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="border-t px-3 pb-3 pt-1 text-sm leading-relaxed" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
