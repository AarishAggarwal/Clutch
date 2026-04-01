"use client";

import * as React from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("astra-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("astra-theme", next ? "dark" : "light");
    setIsDark(next);
  }

  if (!mounted) {
    return <span className="inline-block h-8 w-[4.5rem] rounded-lg" style={{ background: "var(--bg-muted)" }} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-secondary shrink-0 px-3 py-1.5 text-xs font-medium"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
