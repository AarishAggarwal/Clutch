"use client";

import Link from "next/link";
import type { UniversityRecord } from "@/lib/universityTypes";
import type { ListBand } from "@/lib/universityShortlist";
import UniversityLogo from "@/components/universities/UniversityLogo";

const bandLabel: Record<ListBand, string> = {
  dream: "Dream",
  target: "Target",
  reach: "Reach",
};

export default function UniversityCard(props: {
  university: UniversityRecord;
  shortlisted: boolean;
  listBand?: ListBand;
  onToggleShortlist: (slug: string) => void;
  onListBandChange?: (slug: string, band: ListBand) => void;
}) {
  const { university, shortlisted, listBand = "target", onToggleShortlist, onListBandChange } = props;
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
      {shortlisted && onListBandChange ? (
        <div className="mt-3">
          <label className="section-meta mb-1 block text-[10px] uppercase tracking-wider">List tier</label>
          <select
            value={listBand}
            onChange={(e) => onListBandChange(university.slug, e.target.value as ListBand)}
            className="input-base w-full py-1.5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {(Object.keys(bandLabel) as ListBand[]).map((b) => (
              <option key={b} value={b}>
                {bandLabel[b]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
