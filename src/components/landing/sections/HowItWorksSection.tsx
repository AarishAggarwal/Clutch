const steps = [
  {
    n: "01",
    title: "Build your profile",
    body: "School, grades, interests, and goals—so every tool (essays, ideator, guidance) speaks in context instead of generic prompts.",
  },
  {
    n: "02",
    title: "Explore opportunities",
    body: "Shape a college list with filters and data, mine the competitions database, and capture activities and awards in structured fields.",
  },
  {
    n: "03",
    title: "Strengthen applications",
    body: "Draft and revise essays with AI evaluation tuned to admissions readers; use the project ideator to deepen your spike or story.",
  },
  {
    n: "04",
    title: "Execute with guidance",
    body: "Use the dashboard and planning surfaces to sequence deadlines, and loop in your counselor where the product surfaces student IDs and progress.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-24 border-t py-16 sm:py-20" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Four steps from setup to execution. No gimmicks—just the same sequence strong applicants already follow, with structure and AI where it helps.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="panel-muted relative overflow-hidden p-5">
            <span
              className="mb-3 inline-block text-2xl font-semibold tabular-nums"
              style={{ color: "color-mix(in oklab, var(--accent) 55%, var(--text-muted))" }}
            >
              {s.n}
            </span>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {s.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
