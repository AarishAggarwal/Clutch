"use client";

import * as React from "react";
import Link from "next/link";
import type { UniversityRecord } from "@/lib/universityTypes";

function readShortlistSlugs(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem("savedUniversities");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function prettyAcceptance(rate: number | null) {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function prettyCost(n: number | null) {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

function deadlinesLine(uni: UniversityRecord) {
  const parts: string[] = [];
  if (uni.admissionsDeadlineED) parts.push(`ED ${uni.admissionsDeadlineED}`);
  if (uni.admissionsDeadlineEA) parts.push(`EA ${uni.admissionsDeadlineEA}`);
  if (uni.admissionsDeadlineRD) parts.push(`RD ${uni.admissionsDeadlineRD}`);
  return parts.length ? parts.join(" · ") : "—";
}

export default function HomeShortlistSection() {
  const [slugs, setSlugs] = React.useState<string[]>([]);
  const [allUniversities, setAllUniversities] = React.useState<UniversityRecord[]>([]);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = React.useState(false);

  const refreshSlugs = React.useCallback(() => {
    setSlugs(readShortlistSlugs());
  }, []);

  React.useEffect(() => {
    refreshSlugs();
    void (async () => {
      try {
        const res = await fetch("/api/universities");
        const data = (await res.json()) as { universities: UniversityRecord[] };
        setAllUniversities(data.universities ?? []);
      } finally {
        setLoaded(true);
      }
    })();

    function onStorage(e: StorageEvent) {
      if (e.key === "savedUniversities") refreshSlugs();
    }
    function onShortlistUpdated() {
      refreshSlugs();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshSlugs);
    window.addEventListener("shortlist-updated", onShortlistUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshSlugs);
      window.removeEventListener("shortlist-updated", onShortlistUpdated);
    };
  }, [refreshSlugs]);

  const slugSet = React.useMemo(() => new Set(slugs), [slugs]);
  const shortlistUnis = React.useMemo(
    () => allUniversities.filter((u) => slugSet.has(u.slug)).sort((a, b) => a.name.localeCompare(b.name)),
    [allUniversities, slugSet],
  );

  function toggleRow(slug: string) {
    setOpen((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  return (
    <section className="panel mt-6 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="section-heading">Shortlisted universities</div>
          <p className="section-meta mt-0.5 max-w-xl">
            Expand a school for a quick fact snapshot and links straight into the essay workspace tabs.
          </p>
        </div>
        <Link href="/universities" className="btn-secondary px-3 py-1.5 text-sm">
          Manage list
        </Link>
      </div>

      {!loaded ? (
        <div className="section-meta py-6 text-center">Loading your shortlist…</div>
      ) : slugs.length === 0 ? (
        <div className="panel-muted rounded-lg p-4 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You haven’t shortlisted any universities yet.
          </p>
          <Link href="/universities" className="btn-primary mt-3 inline-block text-sm">
            Browse universities
          </Link>
        </div>
      ) : shortlistUnis.length === 0 ? (
        <div className="panel-muted rounded-lg p-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Shortlist is saved locally, but no matching schools were found in your workspace database. Try syncing data from
          the universities page.
        </div>
      ) : (
        <ul className="space-y-2">
          {shortlistUnis.map((uni) => {
            const expanded = !!open[uni.slug];
            return (
              <li
                key={uni.slug}
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleRow(uni.slug)}
                    className="flex flex-1 items-center gap-2 text-left"
                    aria-expanded={expanded}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm" style={{ color: "var(--text-muted)" }}>
                      {expanded ? "▼" : "▶"}
                    </span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {uni.name}
                    </span>
                    {uni.city && uni.state ? (
                      <span className="section-meta hidden sm:inline">
                        · {uni.city}, {uni.state}
                      </span>
                    ) : null}
                  </button>
                  <Link
                    href={`/universities/${uni.slug}`}
                    className="btn-secondary shrink-0 px-2.5 py-1.5 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Profile
                  </Link>
                </div>

                {expanded ? (
                  <div className="space-y-3 border-t px-3 py-3 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="section-meta text-xs uppercase tracking-wide">Acceptance</dt>
                        <dd style={{ color: "var(--text-primary)" }}>{prettyAcceptance(uni.acceptanceRate)}</dd>
                      </div>
                      <div>
                        <dt className="section-meta text-xs uppercase tracking-wide">Est. annual cost</dt>
                        <dd style={{ color: "var(--text-primary)" }}>{prettyCost(uni.averageAnnualCost)}</dd>
                      </div>
                      <div>
                        <dt className="section-meta text-xs uppercase tracking-wide">Testing</dt>
                        <dd style={{ color: "var(--text-primary)" }}>{uni.testingPolicy ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="section-meta text-xs uppercase tracking-wide">App deadlines</dt>
                        <dd style={{ color: "var(--text-primary)" }}>{deadlinesLine(uni)}</dd>
                      </div>
                    </dl>

                    <div>
                      <div className="section-meta mb-1.5 text-xs uppercase tracking-wide">Essay workspace</div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/essays?tab=common"
                          className="chip chip-teal px-3 py-1.5 text-xs no-underline hover:opacity-90"
                        >
                          Common App tab
                        </Link>
                        <Link
                          href={`/essays?tab=university&uni=${encodeURIComponent(uni.slug)}`}
                          className="chip chip-amber px-3 py-1.5 text-xs no-underline hover:opacity-90"
                        >
                          Supplements tab
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
