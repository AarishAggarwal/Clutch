"use client";

import * as React from "react";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import CompetitionDetailDrawer from "@/components/competitions/CompetitionDetailDrawer";
import { competitionsData } from "@/lib/competitionsData";
import type { CompetitionRecord } from "@/lib/competitionTypes";

const SHORTLIST_KEY = "savedCompetitions";

const slugIndex = new Map(competitionsData.map((c) => [c.slug, c]));

export default function ActivitiesCompetitionsPage() {
  const [tab, setTab] = React.useState<"all" | "discover" | "saved">("all");
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [interestFilter, setInterestFilter] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState("");
  const [savedSlugs, setSavedSlugs] = React.useState<string[]>([]);
  const [detailSlug, setDetailSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(SHORTLIST_KEY);
    if (raw) {
      try {
        setSavedSlugs(JSON.parse(raw) as string[]);
      } catch {
        setSavedSlugs([]);
      }
    }
  }, []);

  const types = React.useMemo(
    () => Array.from(new Set(competitionsData.map((c) => c.type).filter(Boolean))).sort(),
    [],
  );
  const interests = React.useMemo(
    () => Array.from(new Set(competitionsData.map((c) => c.interests).filter(Boolean))).sort(),
    [],
  );
  const locations = React.useMemo(
    () => Array.from(new Set(competitionsData.map((c) => c.location).filter(Boolean))).sort(),
    [],
  );

  function toggleShortlist(slug: string) {
    const next = savedSlugs.includes(slug)
      ? savedSlugs.filter((x) => x !== slug)
      : Array.from(new Set([...savedSlugs, slug]));
    setSavedSlugs(next);
    window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next));
  }

  const filtered = competitionsData.filter((c) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = `${c.name} ${c.location} ${c.type} ${c.interests}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (typeFilter && c.type !== typeFilter) return false;
    if (interestFilter && c.interests !== interestFilter) return false;
    if (locationFilter && c.location !== locationFilter) return false;
    return true;
  });

  const visible: CompetitionRecord[] =
    tab === "saved" ? filtered.filter((c) => savedSlugs.includes(c.slug)) : filtered;

  const selectedCompetition = detailSlug ? slugIndex.get(detailSlug) ?? null : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-4">
          <h1 className="page-title">Activities · Competitions</h1>
          <p className="page-subtitle">
            Explore high school competitions, filter by interest, and save the ones you want to target.
          </p>
        </div>

        <section className="panel p-4">
          <div className="nav-pill mb-3 w-fit max-w-full flex-wrap">
            <button type="button" onClick={() => setTab("all")} className={["nav-pill-link", tab === "all" ? "nav-pill-link--active" : ""].join(" ")}>
              All
            </button>
            <button type="button" onClick={() => setTab("discover")} className={["nav-pill-link", tab === "discover" ? "nav-pill-link--active" : ""].join(" ")}>
              Discover
            </button>
            <button type="button" onClick={() => setTab("saved")} className={["nav-pill-link", tab === "saved" ? "nav-pill-link--active" : ""].join(" ")}>
              Saved ({savedSlugs.length})
            </button>
          </div>

          <div className="mb-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search competitions, interests, locations..."
              className="input-base w-full min-w-72"
            />
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base w-auto">
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={interestFilter} onChange={(e) => setInterestFilter(e.target.value)} className="input-base w-auto">
              <option value="">All interests</option>
              {interests.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="input-base w-auto">
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c) => (
              <CompetitionCard
                key={c.id}
                competition={c}
                shortlisted={savedSlugs.includes(c.slug)}
                onToggleShortlist={toggleShortlist}
                onOpenDetail={setDetailSlug}
              />
            ))}
          </div>

          {!visible.length ? (
            <div className="panel-muted mt-3 p-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No competitions match current filters.
            </div>
          ) : null}
        </section>
      </div>

      <CompetitionDetailDrawer
        competition={selectedCompetition}
        open={Boolean(selectedCompetition)}
        shortlisted={selectedCompetition ? savedSlugs.includes(selectedCompetition.slug) : false}
        onClose={() => setDetailSlug(null)}
        onToggleShortlist={toggleShortlist}
      />
    </div>
  );
}

