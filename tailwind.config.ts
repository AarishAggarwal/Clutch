import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        error: "#ba1a1a",
        surface: "#f8f9fb",
        background: "#f8f9fb",
        "text-muted": "#8C959F",
        "text-primary": "#1C2128",
        "text-secondary": "#57606A",
        "border-subtle": "#E1E8EF",
        "reach-rose": "#F43F5E",
        "match-amber": "#F59E0B",
        "safety-green": "#10B981",
        primary: "#3525cd",
        "primary-container": "#4f46e5",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "surface-container": "#eceef0",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        outline: "#777587",
        "sidebar-bg": "#0D1117",
        "sidebar-active": "#1C2128",
      },
      spacing: {
        "rolebar-height": "38px",
        "topbar-height": "52px",
        "sidebar-width": "240px",
        "container-padding": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
