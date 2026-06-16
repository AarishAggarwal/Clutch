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
        error: "var(--color-error)",
        surface: "var(--color-surface)",
        background: "var(--color-background)",
        "text-muted": "var(--color-text-muted)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border-subtle": "var(--color-border-subtle)",
        "reach-rose": "var(--color-reach-rose)",
        "match-amber": "var(--color-match-amber)",
        "safety-green": "var(--color-safety-green)",
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          container: "rgb(var(--primary-container-rgb) / <alpha-value>)",
          fixed: "var(--color-primary-fixed)",
          "fixed-dim": "var(--color-primary-fixed-dim)",
        },
        "surface-container": "var(--color-surface-container)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        outline: "var(--color-outline)",
        "sidebar-bg": "var(--sidebar-bg)",
        "sidebar-active": "var(--sidebar-active)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-muted": "var(--sidebar-muted)",
        "sidebar-hover": "var(--sidebar-hover)",
        "rolebar-bg": "var(--rolebar-bg)",
        "rolebar-text": "var(--rolebar-text)",
        "rolebar-active": "var(--rolebar-active)",
        elevated: "var(--color-elevated)",
        overlay: "var(--color-overlay)",
        "notification-unread": "var(--color-notification-unread)",
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
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
    },
  },
  plugins: [],
};

export default config;
