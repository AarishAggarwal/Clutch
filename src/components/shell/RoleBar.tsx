"use client";

import Link from "next/link";

export default function RoleBar({ role }: { role: "student" | "counselor" }) {
  const isCounselor = role === "counselor";

  return (
    <div className="fixed left-[240px] right-0 top-0 z-50 flex h-[38px] items-center justify-between border-b border-sidebar-border bg-rolebar-bg px-6 text-[10px] font-bold uppercase tracking-widest text-rolebar-text">
      <div className="flex items-center gap-4">
        <span className="text-sidebar-muted">Portal</span>
        <div className="flex gap-2">
          {!isCounselor ? (
            <span className="flex items-center gap-2 rounded bg-rolebar-active px-2 py-1 text-sidebar-text">
              <span className="h-1.5 w-1.5 rounded-full bg-safety-green" />
              Student
            </span>
          ) : (
            <Link
              href="/dashboard"
              className="rounded px-2 py-1 text-sidebar-muted transition-colors hover:text-sidebar-text"
            >
              Student
            </Link>
          )}
          {isCounselor ? (
            <span className="flex items-center gap-2 rounded bg-rolebar-active px-2 py-1 text-primary-fixed-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-fixed-dim" />
              Counsellor
            </span>
          ) : (
            <Link
              href="/counselor/dashboard"
              className="rounded px-2 py-1 text-sidebar-muted transition-colors hover:text-sidebar-text"
            >
              Counsellor
            </Link>
          )}
        </div>
      </div>
      <span className="hidden text-sidebar-muted sm:inline">
        {isCounselor ? "Counsellor workspace" : "Student workspace"}
      </span>
    </div>
  );
}
