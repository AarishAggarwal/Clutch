"use client";

import Link from "next/link";
import type { UniversityRecord } from "@/lib/universityTypes";
import UniversityLogo from "@/components/universities/UniversityLogo";

export default function UniversityCard(props: {
  university: UniversityRecord;
  shortlisted: boolean;
  onToggleShortlist: (slug: string) => void;
}) {
  const { university, shortlisted, onToggleShortlist } = props;
  return (
    <article className="panel group p-4 transition hover:shadow-[0_4px_14px_-6px_rgba(16,24,40,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <UniversityLogo name={university.name} logoUrl={university.logoUrl} website={university.website} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {university.name}
            </div>
            <div className="section-meta mt-0.5">
              {university.city ?? "—"}, {university.state ?? "—"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleShortlist(university.slug)}
          className="btn-ghost h-9 w-9 shrink-0 rounded-lg p-0 text-lg leading-none"
          aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          aria-pressed={shortlisted}
        >
          <span style={{ color: shortlisted ? "var(--accent)" : "var(--text-muted)" }}>{shortlisted ? "♥" : "♡"}</span>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="panel-muted px-2.5 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="section-meta block">Net price</span>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {university.averageAnnualCost != null ? `$${university.averageAnnualCost.toLocaleString()}` : "Not available"}
          </span>
        </div>
        <div className="panel-muted px-2.5 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="section-meta block">Admit rate</span>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {university.acceptanceRate != null ? `${(university.acceptanceRate * 100).toFixed(1)}%` : "Not available"}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge-neutral">{university.control ?? "Institution"}</span>
          {university.dataQuality ? <span className="badge-accent">Data {university.dataQuality.coveragePct}%</span> : null}
        </div>
        <Link href={`/universities/${university.slug}`} className="btn-primary px-3 py-1.5 text-xs">
          View details
        </Link>
      </div>
    </article>
  );
}
