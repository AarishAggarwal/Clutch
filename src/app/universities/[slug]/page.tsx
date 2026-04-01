import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { getUniversityBySlug, getSuggestedUniversities } from "@/server/universities/universityService";
import type { UniversityRecord } from "@/lib/universityTypes";
import type { ReactNode } from "react";
import UniversityLogo from "@/components/universities/UniversityLogo";
import UniversityShortlistButton from "@/components/universities/UniversityShortlistButton";
import {
  IconBuilding,
  IconCheck,
  IconCurrency,
  IconGlobe,
  IconMail,
  IconMapPin,
  IconPhone,
  IconReceipt,
  IconSparkles,
  IconTarget,
} from "@/components/universities/profileIcons";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

function prettyPercent(v: number | null) {
  return v == null ? "—" : `${(v * 100).toFixed(1)}%`;
}

function prettyMoney(v: number | null) {
  return v == null ? "—" : `$${v.toLocaleString()}`;
}

function satCompositeMid(uni: UniversityRecord): number | null {
  const rwMid =
    uni.satReading25 != null && uni.satReading75 != null ? (uni.satReading25 + uni.satReading75) / 2 : null;
  const mMid = uni.satMath25 != null && uni.satMath75 != null ? (uni.satMath25 + uni.satMath75) / 2 : null;
  if (rwMid != null && mMid != null) return Math.round((rwMid + mMid) / 2);
  if (rwMid != null) return Math.round(rwMid);
  if (mMid != null) return Math.round(mMid);
  return null;
}

function actCompositeMid(uni: UniversityRecord): number | null {
  if (uni.act25 != null && uni.act75 != null) return Math.round((uni.act25 + uni.act75) / 2);
  return null;
}

function admitBand(acceptanceRate: number | null): { label: string; tone: "reach" | "mid" | "wide" } {
  if (acceptanceRate == null) return { label: "—", tone: "mid" };
  if (acceptanceRate <= 0.12) return { label: "REACH", tone: "reach" };
  if (acceptanceRate <= 0.35) return { label: "TARGET", tone: "mid" };
  return { label: "LIKELY", tone: "wide" };
}

function buildAbout(uni: UniversityRecord): { lead: string; more: string | null } {
  const sentences: string[] = [];
  if (uni.control && uni.level) {
    sentences.push(`${uni.name} is a ${uni.control.toLowerCase()} ${uni.level.toLowerCase()}.`);
  } else if (uni.control) {
    sentences.push(`${uni.name} is a ${uni.control.toLowerCase()} institution.`);
  }
  if (uni.city && uni.state) {
    sentences.push(`Main campus is in ${uni.city}, ${uni.state}.`);
  }
  if (uni.campusSetting) {
    sentences.push(`Setting: ${uni.campusSetting}.`);
  }
  if (uni.testingPolicy) {
    sentences.push(`Testing policy: ${uni.testingPolicy}.`);
  }
  if (uni.notes?.trim()) {
    sentences.push(uni.notes.trim());
  }
  const full = sentences.join(" ").trim();
  if (!full) {
    return {
      lead: `We don’t yet have a narrative summary for ${uni.name}. Metrics below are sourced from your local institutional dataset.`,
      more: null,
    };
  }
  if (full.length < 260) return { lead: full, more: null };
  const cut = full.indexOf(". ", 220);
  const i = cut > 0 ? cut + 1 : 240;
  return { lead: full.slice(0, i).trim(), more: full.slice(i).trim() };
}

function StatItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 border-r border-[var(--uni-border)] px-3 py-3 last:border-r-0 sm:px-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--uni-muted)]">
        <span className="text-[var(--uni-text)] opacity-70">{icon}</span>
        {label}
      </div>
      <div className="truncate text-sm font-semibold text-[var(--uni-text)]" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
    </div>
  );
}

function MetricTriple({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="uni-profile-card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[var(--uni-text)]">{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="uni-metric-value">{it.value}</div>
            <div className="mt-1.5 text-xs font-medium text-[var(--uni-muted)]">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function UniversityDetailPage({ params }: { params: { slug: string } }) {
  const uni = await getUniversityBySlug(params.slug);
  if (!uni) return notFound();

  const suggested = await getSuggestedUniversities(uni.slug, 3);
  const { lead, more } = buildAbout(uni);
  const band = admitBand(uni.acceptanceRate);
  const bandColor = band.tone === "reach" ? "var(--uni-reach)" : undefined;
  const satMid = satCompositeMid(uni);
  const actMid = actCompositeMid(uni);
  const tuition = uni.tuitionOutOfState ?? uni.tuitionInState;
  const institution = [uni.level ?? "4-year institution", uni.control].filter(Boolean).join(" · ");

  const deadlines = [
    { key: "ED", label: "Early Decision", value: uni.admissionsDeadlineED },
    { key: "EA", label: "Early Action", value: uni.admissionsDeadlineEA },
    { key: "RD", label: "Regular Decision", value: uni.admissionsDeadlineRD },
  ].filter((d) => d.value);

  return (
    <div className="uni-profile min-h-full pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-8">
            {/* Hero */}
            <div className="uni-profile-card p-6 sm:p-8">
              <div className="text-xs text-[var(--uni-muted)]">
                <Link href="/universities" className="transition hover:text-[var(--uni-text)]">
                  Colleges
                </Link>{" "}
                / <span className="text-[var(--uni-text)]">{uni.name}</span>
              </div>

              <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <UniversityLogo name={uni.name} logoUrl={uni.logoUrl} website={uni.website} className="h-16 w-16 rounded-full" />
                  <div className="min-w-0">
                    <h1 className={`${playfair.className} text-3xl font-semibold tracking-tight text-[var(--uni-text)] sm:text-4xl`}>
                      {uni.name}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--uni-muted)]">
                      {[uni.city, uni.state].filter(Boolean).join(", ") || "Location not available"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/chat" className="uni-profile-btn-outline">
                    <IconSparkles className="h-4 w-4" />
                    See my chances
                  </Link>
                  <UniversityShortlistButton slug={uni.slug} profileVariant />
                </div>
              </div>

              {/* Quick stats strip */}
              <div className="uni-profile-stat-strip mt-8 flex flex-wrap divide-y divide-[var(--uni-border)] sm:flex-nowrap sm:divide-y-0">
                <StatItem
                  icon={
                    <IconTarget
                      className={band.tone === "reach" ? "text-[var(--uni-reach)]" : "text-[var(--uni-muted)]"}
                    />
                  }
                  label="Admit profile"
                  value={band.label}
                  valueColor={bandColor}
                />
                <StatItem icon={<IconBuilding className="text-[var(--uni-muted)]" />} label="Institution" value={institution} />
                <StatItem icon={<IconMail className="text-[var(--uni-muted)]" />} label="Application fee" value={prettyMoney(uni.applicationFee)} />
                <StatItem icon={<IconCurrency className="text-[var(--uni-muted)]" />} label="Tuition" value={prettyMoney(tuition)} />
                <StatItem icon={<IconCheck className="text-[var(--uni-muted)]" />} label="Admission rate" value={prettyPercent(uni.acceptanceRate)} />
                <StatItem
                  icon={<IconReceipt className="text-[var(--uni-muted)]" />}
                  label="Avg. cost after aid"
                  value={prettyMoney(uni.averageAnnualCost)}
                />
              </div>
            </div>

            {/* About */}
            <div className="uni-profile-card p-6 sm:p-7">
              <h2 className="text-sm font-semibold text-[var(--uni-text)]">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--uni-muted)]">{lead}</p>
              {more ? (
                <details className="group mt-3">
                  <summary className="uni-profile-link cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    See more
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--uni-muted)]">{more}</p>
                </details>
              ) : null}
              {uni.popularMajors.length ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--uni-border)] pt-5">
                  {uni.popularMajors.slice(0, 8).map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-[var(--uni-border)] bg-[color-mix(in_oklab,var(--uni-cream)_55%,var(--uni-card))] px-2.5 py-1 text-xs font-medium text-[var(--uni-text)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <MetricTriple
              title="Graduation outcomes"
              items={[
                { label: "Median earnings (10 yrs)", value: prettyMoney(uni.medianEarnings) },
                { label: "Student loan picture", value: "—" },
                { label: "Graduation rate", value: prettyPercent(uni.graduationRate) },
              ]}
            />

            <MetricTriple
              title="Academic outlook"
              items={[
                {
                  label: "Estimated SAT mid-range",
                  value: satMid != null ? String(satMid) : "—",
                },
                { label: "Estimated ACT mid-range", value: actMid != null ? String(actMid) : "—" },
                {
                  label: "Testing",
                  value: uni.testingPolicy ? (uni.testingPolicy.length > 28 ? `${uni.testingPolicy.slice(0, 28)}…` : uni.testingPolicy) : "—",
                },
              ]}
            />

            <MetricTriple
              title="Who you’ll study with"
              items={[
                { label: "Undergraduate enrollment", value: uni.undergradEnrollment != null ? uni.undergradEnrollment.toLocaleString() : "—" },
                { label: "Total enrollment", value: uni.totalEnrollment != null ? uni.totalEnrollment.toLocaleString() : "—" },
                {
                  label: "Housing",
                  value: uni.housingAvailable == null ? "—" : uni.housingAvailable ? "On-campus housing" : "Varies / limited",
                },
              ]}
            />

            {/* CTA */}
            <div className="uni-profile-card relative overflow-hidden p-6 sm:p-7">
              <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[color-mix(in_oklab,var(--uni-forest)_12%,transparent)] blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--uni-text)]">Strengthen your application</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--uni-muted)]">
                    Turn this school’s bar into a clear essay and activities narrative—with structured coaching in the workspace.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--uni-forest)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:text-[#0a0f0d]"
                >
                  Open essay coach
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
            <div className="uni-profile-card p-5">
              <h2 className="text-sm font-semibold text-[var(--uni-text)]">Contact</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <IconMapPin className="mt-0.5 text-[var(--uni-muted)]" />
                  <span className="text-[var(--uni-muted)]">{uni.address ?? "Address not available"}</span>
                </li>
                <li className="flex gap-3">
                  <IconPhone className="mt-0.5 text-[var(--uni-muted)]" />
                  <span className="text-[var(--uni-muted)]">{uni.phone ?? "—"}</span>
                </li>
                <li className="flex gap-3">
                  <IconGlobe className="mt-0.5 text-[var(--uni-muted)]" />
                  {uni.website ? (
                    <a href={uni.website} target="_blank" rel="noreferrer" className="font-medium text-[var(--uni-link)] hover:underline">
                      {uni.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-[var(--uni-muted)]">—</span>
                  )}
                </li>
              </ul>
            </div>

            <div className="uni-profile-card p-5">
              <h2 className="text-sm font-semibold text-[var(--uni-text)]">Deadlines</h2>
              {deadlines.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--uni-muted)]">No deadline text on file for this record.</p>
              ) : (
                <div className="relative mt-4 space-y-4 pl-4">
                  <div className="uni-timeline-line" />
                  {deadlines.map((d, i) => (
                    <div key={d.key} className="relative flex gap-3">
                      <div
                        className={`relative z-[1] mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                          i === deadlines.length - 1 ? "border-[var(--uni-forest)] bg-[var(--uni-forest)]" : "border-[var(--uni-border)] bg-[var(--uni-card)]"
                        }`}
                      />
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-[var(--uni-muted)]">{d.label}</div>
                        <div className="text-sm font-medium text-[var(--uni-text)]">{d.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="uni-profile-card p-5">
              <h2 className="text-sm font-semibold text-[var(--uni-text)]">Suggested for you</h2>
              <ul className="mt-4 space-y-3">
                {suggested.map((s) => (
                  <li key={s.id}>
                    <Link href={`/universities/${s.slug}`} className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-[var(--uni-border)] hover:bg-[color-mix(in_oklab,var(--uni-cream)_40%,var(--uni-card))]">
                      <UniversityLogo name={s.name} logoUrl={s.logoUrl} website={s.website} className="h-10 w-10 rounded-full" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--uni-text)]">{s.name}</div>
                        <div className="truncate text-xs text-[var(--uni-muted)]">
                          {[s.city, s.state].filter(Boolean).join(", ")}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--uni-border)] bg-[color-mix(in_oklab,var(--uni-cream)_65%,var(--uni-card))] p-4 text-xs leading-relaxed text-[var(--uni-muted)]">
              <div className="font-semibold text-[var(--uni-text)]">Data sources</div>
              <p className="mt-2">
                Core: {uni.sourceCoreName ?? "—"}. Last verified {uni.lastVerifiedAt ? new Date(uni.lastVerifiedAt).toLocaleDateString() : "—"}.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <a href={uni.sourceCoreUrl ?? uni.sourceUrl ?? "#"} target="_blank" rel="noreferrer" className="font-medium text-[var(--uni-link)] hover:underline">
                  Core
                </a>
                <a href={uni.sourceAdmissionsUrl ?? "#"} target="_blank" rel="noreferrer" className="font-medium text-[var(--uni-link)] hover:underline">
                  Admissions
                </a>
                {uni.dataQuality?.missingCriticalFields?.length ? (
                  <span className="text-[var(--uni-reach)]">Missing: {uni.dataQuality.missingCriticalFields.slice(0, 3).join(", ")}</span>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
