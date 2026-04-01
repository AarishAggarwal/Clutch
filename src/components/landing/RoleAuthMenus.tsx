"use client";

import Link from "next/link";
import * as React from "react";

export function RoleSignupDropdown({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
        style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
      >
        Sign up
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)]"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
        >
          <Link href="/auth/signup?role=student" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As student
          </Link>
          <Link href="/auth/signup?role=counselor" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As counselor
          </Link>
          <Link href="/auth/signup?role=specialist" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As specialist / alumni
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function RoleLoginDropdown({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
        style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
      >
        Log in
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)]"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
        >
          <Link href="/auth/login?role=student" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As student
          </Link>
          <Link href="/auth/login?role=counselor" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As counselor
          </Link>
          <Link href="/auth/login?role=specialist" onClick={onClose} className="block px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]" style={{ color: "var(--text-secondary)" }}>
            As specialist / alumni
          </Link>
        </div>
      ) : null}
    </div>
  );
}
