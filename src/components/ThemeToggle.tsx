"use client";

import * as React from "react";
import MaterialIcon from "@/components/shell/MaterialIcon";
import { applyTheme, resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

type Props = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const dark = resolveTheme() === "dark";
    applyTheme(dark ? "dark" : "light");
    setIsDark(dark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next ? "dark" : "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  if (!mounted) {
    return <span className={`theme-toggle ${className}`} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle-thumb">
        <MaterialIcon name={isDark ? "dark_mode" : "light_mode"} className="!text-[16px]" />
      </span>
    </button>
  );
}
