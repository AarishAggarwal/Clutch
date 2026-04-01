"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/projects/progress", label: "Progress" },
  { href: "/projects/chatbot", label: "Chatbot" },
  { href: "/projects/brainstorm", label: "Brainstorm" },
  { href: "/projects/competitions", label: "Competitions" },
];

export default function ProjectWorkspaceChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--bg-app)" }}>
      <header
        className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur sm:px-6"
        style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--bg-elevated) 94%, transparent)" }}
      >
        <Link
          href="/activities"
          className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-85"
          style={{ color: "var(--text-primary)" }}
        >
          <span aria-hidden>←</span>
          Back to application
        </Link>
        <nav className="nav-pill flex flex-wrap justify-end gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={["nav-pill-link whitespace-nowrap text-sm", active ? "nav-pill-link--active" : ""].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
