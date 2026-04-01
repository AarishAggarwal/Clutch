"use client";

import * as React from "react";
import type { UniversityRecord } from "@/lib/universityTypes";
import UniversityCard from "@/components/universities/UniversityCard";

export default function UniversitiesPage() {
  const [rows, setRows] = React.useState<UniversityRecord[]>([]);
  const [tab, setTab] = React.useState<"all" | "discover" | "list">("all");
  const [query, setQuery] = React.useState("");
  const [control, setControl] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("");
  const [costMax, setCostMax] = React.useState("");
  const [acceptanceMax, setAcceptanceMax] = React.useState("");
  const [housingOnly, setHousingOnly] = React.useState(false);
  const [sort, setSort] = React.useState("alphabetical");
  const [savedSlugs, setSavedSlugs] = React.useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshNote, setRefreshNote] = React.useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = React.useState<string | null>(null);
  const [lastRefreshReport, setLastRefreshReport] = React.useState<{
    refreshed: number;
    notFound: number;
    failed: number;
    usingLocalScorecardFolder: boolean;
    loadedUniversities?: string[];
  } | null>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem("savedUniversities");
    if (raw) setSavedSlugs(JSON.parse(raw) as string[]);
  }, []);

  React.useEffect(() => {
    void (async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (control) params.set("control", control);
      if (stateFilter) params.set("state", stateFilter);
      if (costMax) params.set("costMax", costMax);
      if (acceptanceMax) params.set("acceptanceMax", acceptanceMax);
      if (housingOnly) params.set("housingOnly", "1");
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/universities?${params.toString()}`);
      const data = (await res.json()) as { universities: UniversityRecord[] };
      setRows(data.universities);
      if (data.universities.length) {
        const latest = data.universities
          .map((u) => u.lastVerifiedAt)
          .filter((v): v is string => Boolean(v))
          .sort()
          .at(-1);
        setLastRefreshAt(latest ?? null);
      }
    })();
  }, [query, control, stateFilter, costMax, acceptanceMax, housingOnly, sort]);

  const states = Array.from(
    new Set(rows.map((u) => u.state).filter((s): s is string => s != null && s !== "")),
  ).sort();

  function toggleShortlist(slug: string) {
    const next = savedSlugs.includes(slug)
      ? savedSlugs.filter((x) => x !== slug)
      : Array.from(new Set([...savedSlugs, slug]));
    setSavedSlugs(next);
    window.localStorage.setItem("savedUniversities", JSON.stringify(next));
    window.dispatchEvent(new Event("shortlist-updated"));
  }

  const visible = tab === "list" ? rows.filter((r) => savedSlugs.includes(r.slug)) : rows;

  async function handleRefreshData() {
    setIsRefreshing(true);
    setRefreshNote(null);
    try {
      const res = await fetch("/api/universities/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");
      const refreshPayload = (await res.json()) as {
        ok: boolean;
        report?: {
          refreshed: number;
          notFound: number;
          failed: number;
          usingLocalScorecardFolder: boolean;
          loadedUniversities?: string[];
        };
      };
      if (refreshPayload.report) {
        setLastRefreshReport(refreshPayload.report);
        setRefreshNote(
          `Refreshed ${refreshPayload.report.refreshed}, not found ${refreshPayload.report.notFound}, failed ${refreshPayload.report.failed}${
            refreshPayload.report.usingLocalScorecardFolder ? " (local scorecard folder)" : ""
          }.`,
        );
      } else {
        setRefreshNote("Data refreshed from source.");
      }
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (control) params.set("control", control);
      if (stateFilter) params.set("state", stateFilter);
      if (costMax) params.set("costMax", costMax);
      if (acceptanceMax) params.set("acceptanceMax", acceptanceMax);
      if (housingOnly) params.set("housingOnly", "1");
      if (sort) params.set("sort", sort);
      const dataRes = await fetch(`/api/universities?${params.toString()}`);
      const data = (await dataRes.json()) as { universities: UniversityRecord[] };
      setRows(data.universities);
      const latest = data.universities
        .map((u) => u.lastVerifiedAt)
        .filter((v): v is string => Boolean(v))
        .sort()
        .at(-1);
      setLastRefreshAt(latest ?? null);
    } catch {
      setRefreshNote("Could not refresh right now. Try again.");
    } finally {
      setIsRefreshing(false);
      window.setTimeout(() => setRefreshNote(null), 2500);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-4">
          <h1 className="page-title">College Discovery</h1>
          <p className="page-subtitle">Search, filter, and shortlist universities with structured facts and source-backed data.</p>
        </div>
        <section className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="section-meta">
              Last refresh: {lastRefreshAt ? new Date(lastRefreshAt).toLocaleString() : "Not available"}
            </div>
            <div className="flex items-center gap-2">
              {refreshNote ? <span className="section-meta">{refreshNote}</span> : null}
              <button
                onClick={() => void handleRefreshData()}
                disabled={isRefreshing}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "Refresh data"}
              </button>
            </div>
          </div>
          {lastRefreshReport ? (
            <div className="panel-muted mb-3 p-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              Sync report: refreshed {lastRefreshReport.refreshed}, not found {lastRefreshReport.notFound}, failed{" "}
              {lastRefreshReport.failed}
              {lastRefreshReport.usingLocalScorecardFolder ? " · local CSV pipeline active" : ""}.
              {lastRefreshReport.loadedUniversities?.length
                ? ` Loaded: ${lastRefreshReport.loadedUniversities.join(", ")}`
                : ""}
            </div>
          ) : null}
          <div className="nav-pill mb-3 w-fit max-w-full flex-wrap">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={["nav-pill-link", tab === "all" ? "nav-pill-link--active" : ""].join(" ")}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTab("discover")}
              className={["nav-pill-link", tab === "discover" ? "nav-pill-link--active" : ""].join(" ")}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => setTab("list")}
              className={["nav-pill-link", tab === "list" ? "nav-pill-link--active" : ""].join(" ")}
            >
              Your List ({savedSlugs.length})
            </button>
          </div>
          <div className="mb-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search universities, city, majors..."
              className="input-base w-full min-w-72"
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              value={control}
              onChange={(e) => setControl(e.target.value)}
              className="input-base w-auto"
            >
              <option value="">All control types</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="input-base w-auto"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={costMax}
              onChange={(e) => setCostMax(e.target.value)}
              placeholder="Max annual cost"
              className="input-base w-40"
            />
            <input
              type="number"
              value={acceptanceMax}
              onChange={(e) => setAcceptanceMax(e.target.value)}
              placeholder="Max admit %"
              className="input-base w-32"
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base w-auto">
              <option value="alphabetical">A-Z</option>
              <option value="lowest_cost">Lowest Cost</option>
              <option value="highest_selectivity">Highest Selectivity</option>
              <option value="highest_graduation">Highest Graduation Rate</option>
            </select>
            <label className="input-base flex w-auto items-center gap-2 px-3 py-2 text-sm">
              <input type="checkbox" checked={housingOnly} onChange={(e) => setHousingOnly(e.target.checked)} />
              Housing available
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((u) => (
              <UniversityCard key={u.id} university={u} shortlisted={savedSlugs.includes(u.slug)} onToggleShortlist={toggleShortlist} />
            ))}
          </div>
          {!visible.length ? (
            <div className="panel-muted mt-3 p-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No universities match current filters.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
