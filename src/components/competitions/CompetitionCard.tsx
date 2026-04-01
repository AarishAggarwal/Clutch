"use client";

import type { CompetitionRecord } from "@/lib/competitionTypes";
import { enrichCompetition } from "@/lib/competitionEnrichment";
import * as React from "react";

type Props = {
  competition: CompetitionRecord;
  shortlisted: boolean;
  onToggleShortlist: (slug: string) => void;
  onOpenDetail: (slug: string) => void;
};

function teaser(text: string, max = 96) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function CompetitionCard({ competition, shortlisted, onToggleShortlist, onOpenDetail }: Props) {
  const enriched = React.useMemo(() => enrichCompetition(competition), [competition]);

  return (
    <article className="panel group p-4 transition hover:shadow-[0_4px_14px_-6px_rgba(16,24,40,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {competition.name}
          </h3>
          <div className="section-meta mt-0.5">{competition.location || "—"}</div>
        </div>
        <button
          type="button"
          onClick={() => onToggleShortlist(competition.slug)}
          className="btn-ghost h-9 w-9 shrink-0 rounded-lg p-0 text-lg leading-none"
          aria-label={shortlisted ? "Remove from saved" : "Save competition"}
          aria-pressed={shortlisted}
        >
          <span style={{ color: shortlisted ? "var(--accent)" : "var(--text-muted)" }}>{shortlisted ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="badge-neutral">{competition.type || "General"}</span>
        {competition.interests ? <span className="badge-neutral">{competition.interests}</span> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="panel-muted px-2.5 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="section-meta block">Deadlines</span>
          <span className="font-medium line-clamp-3" style={{ color: "var(--text-primary)" }}>
            {teaser(enriched.deadlineSummary)}
          </span>
        </div>
        <div className="panel-muted px-2.5 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="section-meta block">Eligibility</span>
          <span className="font-medium line-clamp-3" style={{ color: "var(--text-primary)" }}>
            {teaser(enriched.eligibilitySummary)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {competition.website ? (
          <a href={competition.website} target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1.5 text-xs">
            Official site
          </a>
        ) : (
          <span className="section-meta text-xs">No website listed</span>
        )}
        <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => onOpenDetail(competition.slug)}>
          View details
        </button>
      </div>
    </article>
  );
}
