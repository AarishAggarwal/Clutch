export const THEME_STORAGE_KEY = "clutchai-theme";

export function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  const stored =
    window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem("astra-theme");
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

export function resolveTheme(): "light" | "dark" {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const themeInitScript = `(function(){try{var k="clutchai-theme";var s=localStorage.getItem(k)||localStorage.getItem("astra-theme");var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
