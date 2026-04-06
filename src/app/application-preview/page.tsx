"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UniversityRecord } from "@/lib/universityTypes";
import { bandsForSlugs, loadShortlistBands, loadShortlistSlugs, type ListBand } from "@/lib/universityShortlist";

type ActivityRow = {
  id: string;
  title: string;
  category: string;
  organization: string;
  role: string;
  grades: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  description: string;
};

type EssayRow = {
  id: string;
  title: string;
  essayType: string;
  status: string;
  wordCount: number | null;
};

type ProfileRow = {
  fullName: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  gpa: number | null;
  sat: number | null;
  act: number | null;
  intendedMajors: string | null;
};

const bandLabel: Record<ListBand, string> = {
  dream: "Dream",
  target: "Target",
  reach: "Reach",
};

export default function ApplicationPreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [essays, setEssays] = React.useState<EssayRow[]>([]);
  const [universities, setUniversities] = React.useState<UniversityRecord[]>([]);
  const [slugs, setSlugs] = React.useState<string[]>([]);
  const [bands, setBands] = React.useState<Record<string, ListBand>>({});

  React.useEffect(() => {
    setSlugs(loadShortlistSlugs());
    setBands(bandsForSlugs(loadShortlistSlugs(), loadShortlistBands()));
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        const [prRes, actRes, esRes, uniRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/activities"),
          fetch("/api/essays"),
          fetch("/api/universities", { cache: "no-store" }),
        ]);
        if (prRes.status === 401) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        const pr = (await prRes.json()) as { profile: ProfileRow };
        const act = (await actRes.json()) as { activities: ActivityRow[] };
        const es = (await esRes.json()) as { essays: EssayRow[] };
        const uni = (await uniRes.json()) as { universities: UniversityRecord[] };
        setProfile(pr.profile);
        setActivities(act.activities ?? []);
        setEssays(es.essays ?? []);
        setUniversities(uni.universities ?? []);
      } catch {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shortlist = React.useMemo(() => {
    const set = new Set(slugs);
    return universities.filter((u) => set.has(u.slug)).sort((a, b) => a.name.localeCompare(b.name));
  }, [universities, slugs]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="section-meta">Loading preview…</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="page-wrap py-12 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to view your application preview.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={() => router.push("/auth/login?callbackUrl=/application-preview")}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-3xl py-8">
        <div className="mb-8 border-b pb-6" style={{ borderColor: "var(--border-soft)" }}>
          <p className="section-meta mb-1 uppercase tracking-wider">Read-only preview</p>
          <h1 className="page-title">Final application</h1>
          <p className="page-subtitle mt-2">
            A Common App–style snapshot of your profile, writing, activities, and college list—what you have captured in
            this workspace so far.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/profile" className="btn-secondary text-sm">
              Edit profile
            </Link>
            <Link href="/essays" className="btn-secondary text-sm">
              Essays
            </Link>
            <Link href="/activities" className="btn-secondary text-sm">
              Activities
            </Link>
            <Link href="/universities" className="btn-secondary text-sm">
              College list
            </Link>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Profile
          </h2>
          <div className="mt-3 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="section-meta text-xs">Name</dt>
                <dd style={{ color: "var(--text-primary)" }}>{profile?.fullName?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="section-meta text-xs">School</dt>
                <dd style={{ color: "var(--text-primary)" }}>{profile?.schoolName?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="section-meta text-xs">Graduation</dt>
                <dd style={{ color: "var(--text-primary)" }}>{profile?.graduationYear ?? "—"}</dd>
              </div>
              <div>
                <dt className="section-meta text-xs">GPA / tests</dt>
                <dd style={{ color: "var(--text-primary)" }}>
                  {profile?.gpa != null ? profile.gpa.toFixed(2) : "—"}
                  {profile?.sat ? ` · SAT ${profile.sat}` : ""}
                  {profile?.act ? ` · ACT ${profile.act}` : ""}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="section-meta text-xs">Intended major(s)</dt>
                <dd style={{ color: "var(--text-primary)" }}>{profile?.intendedMajors?.trim() || "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Education & college list
          </h2>
          <p className="section-meta mt-1 mb-3">Schools you have shortlisted (with dream / target / reach).</p>
          {shortlist.length === 0 ? (
            <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
              No schools on your list yet.
            </div>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {shortlist.map((u) => (
                <li key={u.slug}>
                  <span style={{ color: "var(--text-primary)" }}>{u.name}</span>
                  <span className="section-meta"> · {bandLabel[bands[u.slug] ?? "target"]}</span>
                  {u.city && u.state ? (
                    <span className="section-meta">
                      {" "}
                      · {u.city}, {u.state}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Activities
          </h2>
          {activities.length === 0 ? (
            <p className="section-meta mt-2">No activities recorded.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-soft)" }}>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.title}
                  </div>
                  <div className="section-meta mt-0.5">
                    {a.category} · {a.organization} · {a.role}
                  </div>
                  <div className="section-meta mt-1">
                    Grades {a.grades} · {a.hoursPerWeek} hrs/wk · {a.weeksPerYear} wk/yr
                  </div>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Writing
          </h2>
          {essays.length === 0 ? (
            <p className="section-meta mt-2">No essay drafts saved.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {essays.map((e) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-soft)" }}>
                  <span style={{ color: "var(--text-primary)" }}>{e.title}</span>
                  <span className="section-meta">
                    {e.essayType.replace(/_/g, " ")} · {e.status}
                    {e.wordCount != null ? ` · ${e.wordCount} words` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
