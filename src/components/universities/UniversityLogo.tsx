"use client";

import * as React from "react";
import { getUniversityMonogram } from "@/server/universities/logoResolver";

function getDomain(website?: string | null) {
  if (!website) return null;
  try {
    const normalized = website.startsWith("http") ? website : `https://${website}`;
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function UniversityLogo(props: { name: string; logoUrl?: string | null; website?: string | null; className?: string }) {
  const { name, logoUrl, website, className } = props;
  const [errored, setErrored] = React.useState(false);
  const domain = getDomain(website);
  const fallbackLogo = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null;
  const [currentSrc, setCurrentSrc] = React.useState<string | null>(logoUrl ?? null);

  React.useEffect(() => {
    setCurrentSrc(logoUrl ?? null);
    setErrored(false);
  }, [logoUrl]);

  if (!currentSrc || errored) {
    return (
      <div
        className={["flex items-center justify-center rounded-xl text-sm font-semibold", className ?? "h-12 w-12"].join(" ")}
        style={{
          background: "var(--bg-muted)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-soft)",
        }}
      >
        {getUniversityMonogram(name)}
      </div>
    );
  }
  return (
    <div
      className={["overflow-hidden rounded-xl", className ?? "h-12 w-12"].join(" ")}
      style={{ border: "1px solid var(--border-soft)", background: "var(--bg-elevated)" }}
    >
      <img
        src={currentSrc}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-1"
        onError={() => {
          if (currentSrc !== fallbackLogo && fallbackLogo) {
            setCurrentSrc(fallbackLogo);
            return;
          }
          setErrored(true);
        }}
      />
    </div>
  );
}
