const points = [
  "Serious applicants need systems, not scattered advice. Astra is organized around essays, lists, activities, projects, and evidence—not a single prompt box.",
  "Strategy and execution stay connected: exploration (colleges, competitions) feeds what you write and what you ship (projects, awards).",
  "AI is task-specific: evaluation for drafts, ideation for projects, and counselor-aware context where appropriate—rather than one generic assistant for everything.",
  "Local-first friendly prototype paths mean you can iterate quickly with your own data; production deployments can layer real auth and multi-tenant counseling.",
];

export function DifferentiationSection() {
  return (
    <section id="why" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            Not “another chatbot for homework”
          </h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
            Most student AI tools optimize for quick answers. Astra is closer to an <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>operations layer</strong> for
            college applications: structured surfaces, durable records, and models invoked where they actually improve outcomes—draft revision, discovery, and project design.
          </p>
        </div>
        <ul className="space-y-4">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "color-mix(in oklab, var(--accent) 18%, transparent)", color: "var(--accent-strong)" }}
                aria-hidden
              >
                ✓
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {p}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
