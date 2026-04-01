"use client";

import Link from "next/link";
import * as React from "react";
import { RoleLoginDropdown, RoleSignupDropdown } from "@/components/landing/RoleAuthMenus";

const nav = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why Astra" },
  { href: "#trust", label: "Trust" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingHeader() {
  const [openMenu, setOpenMenu] = React.useState<null | "signup" | "login">(null);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--bg-app) 88%, transparent)" }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Astra Admissions OS
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:bg-[var(--bg-muted)]"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <RoleSignupDropdown
            open={openMenu === "signup"}
            onToggle={() => setOpenMenu((m) => (m === "signup" ? null : "signup"))}
            onClose={() => setOpenMenu(null)}
          />
          <RoleLoginDropdown
            open={openMenu === "login"}
            onToggle={() => setOpenMenu((m) => (m === "login" ? null : "login"))}
            onClose={() => setOpenMenu(null)}
          />
        </div>
      </div>
    </header>
  );
}
