"use client";

import * as React from "react";
import type { CompetitionRecord } from "@/lib/competitionTypes";
import { enrichCompetition } from "@/lib/competitionEnrichment";

type Props = {
  competition: CompetitionRecord | null;
  open: boolean;
  shortlisted: boolean;
  onClose: () => void;
  onToggleShortlist: (slug: string) => void;
};

export default function CompetitionDetailDrawer({
  competition,
  open,
  shortlisted,
  onClose,
  onToggleShortlist,
}: Props) {
  const enriched = React.useMemo(
    () => (competition ? enrichCompetition(competition) : null),
    [competition],
  );

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !competition || !enriched) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-lg flex-col border-l shadow-2xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-soft)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="competition-drawer-title"
      >
        <div className="flex items-start justify-between gap-3 border-b p-4" style={{ borderColor: "var(--border-soft)" }}>
          <div className="min-w-0">
            <p className="section-meta text-xs uppercase tracking-wide">Competition</p>
            <h2 id="competition-drawer-title" className="mt-1 text-lg font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
              {competition.name}
            </h2>
            <p className="section-meta mt-1">{competition.location || "Location not listed"}</p>
          </div>
          <button type="button" className="btn-ghost shrink-0 px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
              {competition.type || "General"}
            </span>
            <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
              {competition.interests || "Interests not tagged"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="panel-muted rounded-xl p-3">
              <div className="section-meta text-[11px] uppercase tracking-wide">Deadlines (guidance)</div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {enriched.deadlineSummary}
              </p>
            </div>
            <div className="panel-muted rounded-xl p-3">
              <div className="section-meta text-[11px] uppercase tracking-wide">Eligibility (guidance)</div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {enriched.eligibilitySummary}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Our catalog does not include fixed calendar dates per contest. Treat this as orientation only—always confirm dates, fees, and rules on the official site.
          </p>

          {competition.website ? (
            <a
              href={competition.website}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4 inline-flex w-full justify-center sm:w-auto"
            >
              Open official website
            </a>
          ) : null}
        </div>

        <div className="border-t p-4" style={{ borderColor: "var(--border-soft)" }}>
          <button
            type="button"
            className={shortlisted ? "btn-primary w-full" : "btn-secondary w-full"}
            onClick={() => onToggleShortlist(competition.slug)}
          >
            {shortlisted ? "Saved to your list" : "Save to your list"}
          </button>
        </div>
      </aside>
    </div>
  );
}
