"use client";

import type { AuthErrorPresentation } from "@/lib/authErrors";

export default function AuthErrorCallout({
  presentation,
  extraHint,
}: {
  presentation: AuthErrorPresentation;
  extraHint?: string | null;
}) {
  return (
    <div
      className="mt-4 rounded-xl border px-4 py-3 text-sm"
      style={{ borderColor: "var(--danger)", background: "var(--bg-muted)" }}
      role="alert"
    >
      <p className="font-semibold" style={{ color: "var(--danger)" }}>
        {presentation.title}
      </p>
      <p className="mt-1.5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {presentation.body}
      </p>
      {extraHint ? (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {extraHint}
        </p>
      ) : null}
      {presentation.footnote ? (
        <p
          className="mt-3 border-t pt-2 text-xs leading-relaxed"
          style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}
        >
          {presentation.footnote}
        </p>
      ) : null}
    </div>
  );
}
