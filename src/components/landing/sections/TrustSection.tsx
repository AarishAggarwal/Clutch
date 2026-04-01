const stats = [
  { label: "Competitions indexed", value: "600+", note: "From curated high-school competition dataset; filters in-app." },
  { label: "Supplemental prompts", value: "20+", note: "Major universities surfaced in essays workspace (expandable catalog)." },
  { label: "Student beta", value: "—", note: "Placeholder for active users once you ship analytics." },
  { label: "Essays reviewed (AI)", value: "—", note: "Placeholder for aggregate evaluations post-launch." },
  { label: "Project ideas generated", value: "—", note: "Placeholder for ideator usage counters." },
  { label: "Trust posture", value: "Privacy-aware", note: "Designed so profiles and documents can back counselor workflows with clear student IDs." },
];

export function TrustSection() {
  return (
    <section id="trust" className="scroll-mt-24 border-t py-16 sm:py-20" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Proof points we can stand behind today—and room to grow
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Honest metrics beat fake precision. Real numbers ship when you wire analytics; the layout below is ready to swap placeholders for live data.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5 text-left">
            <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {s.value}
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {s.label}
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {s.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
