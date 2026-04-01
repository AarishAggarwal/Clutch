"use client";

import * as React from "react";

export default function UniversityShortlistButton({
  slug,
  className,
  profileVariant,
}: {
  slug: string;
  className?: string;
  /** Pill + heart styling for the university profile hero (reference layout). */
  profileVariant?: boolean;
}) {
  const [onList, setOnList] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("savedUniversities");
      if (!raw) return;
      const slugs = JSON.parse(raw) as string[];
      setOnList(Array.isArray(slugs) && slugs.includes(slug));
    } catch {
      /* ignore */
    }
  }, [slug]);

  function toggle() {
    try {
      const raw = window.localStorage.getItem("savedUniversities");
      const slugs = raw ? (JSON.parse(raw) as string[]) : [];
      const next = onList ? slugs.filter((s) => s !== slug) : Array.from(new Set([...slugs, slug]));
      window.localStorage.setItem("savedUniversities", JSON.stringify(next));
      setOnList(!onList);
      window.dispatchEvent(new Event("shortlist-updated"));
    } catch {
      /* ignore */
    }
  }

  if (profileVariant) {
    const profileClass = onList ? "uni-shortlist-outline" : "uni-shortlist-solid";
    return (
      <button
        type="button"
        onClick={toggle}
        className={[
          "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium transition",
          profileClass,
          className ?? "",
        ].join(" ")}
      >
        <span aria-hidden>{onList ? "♥" : "♡"}</span>
        {onList ? "Shortlisted" : "Shortlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={[onList ? "btn-secondary" : "btn-primary", className].filter(Boolean).join(" ")}
    >
      {onList ? "On your list" : "Add to list"}
    </button>
  );
}
