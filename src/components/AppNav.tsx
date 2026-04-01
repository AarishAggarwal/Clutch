"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const studentNavItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/universities", label: "Universities" },
  { href: "/essays", label: "Essays" },
  { href: "/activities", label: "Activities" },
  { href: "/locker", label: "Locker" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/marketplace", label: "Marketplace" },
];

/** Counselor workspace: single home tab until full auth splits layouts */
const counselorNavItems = [{ href: "/counselor", label: "Home" }];

export default function AppNav() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/projects") || pathname.startsWith("/specialist")) {
    return null;
  }

  const isCounselorUi = pathname.startsWith("/counselor");
  const navItems = isCounselorUi ? counselorNavItems : studentNavItems;
  const brandHref = isCounselorUi ? "/counselor" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--bg-elevated) 92%, transparent)" }}>
      <div className="mx-auto flex h-14 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <Link href={brandHref} className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Astra Admissions OS
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <nav className="nav-pill max-w-[min(100vw-2rem,52rem)]">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={["nav-pill-link whitespace-nowrap", active ? "nav-pill-link--active" : ""].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {!isCounselorUi ? (
            <Link
              href="/profile"
              aria-label="Profile"
              title="Profile"
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                pathname.startsWith("/profile") ? "nav-pill-link--active" : "",
              ].join(" ")}
              style={{
                borderColor: "var(--border-strong)",
                background: pathname.startsWith("/profile") ? "color-mix(in oklab, var(--accent) 14%, var(--bg-elevated))" : "var(--bg-elevated)",
                color: pathname.startsWith("/profile") ? "var(--accent-strong)" : "var(--text-secondary)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
