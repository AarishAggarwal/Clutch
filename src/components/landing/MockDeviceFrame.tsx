import type { ReactNode } from "react";

/** Product-style window chrome for landing mockups — not a real screenshot. */
export function MockDeviceFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-[0_24px_48px_-12px_rgba(15,23,42,0.15)]"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2.5"
        style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)" }}
      >
        <span className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f97066]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f7c948]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5cc689]" />
        </span>
        <span className="mx-auto truncate text-center text-[11px] font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        <span className="w-10 shrink-0" aria-hidden />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
