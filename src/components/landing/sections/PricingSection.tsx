import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Start in beta without friction; add counselor and specialist programs when you’re ready to monetize.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
        <div className="panel p-6 text-left">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Student
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            $0
          </div>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Core workspace during beta. Complete profile on signup; uses local and API-backed features per deployment.
          </p>
          <Link href="/auth/signup?role=student" className="btn-primary mt-4 w-full text-center text-sm">
            Sign up
          </Link>
        </div>
        <div className="panel p-6 text-left ring-1" style={{ borderColor: "var(--border-soft)", boxShadow: "0 0 0 1px color-mix(in oklab, var(--accent) 35%, var(--border-soft))" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Counselor
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            Custom
          </div>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Roster by student ID, holistic progress, essays, activities, locker, marketplace requests—built for teams.
          </p>
          <Link href="/auth/signup?role=counselor" className="btn-primary mt-4 w-full text-center text-sm">
            Get access
          </Link>
        </div>
        <div className="panel p-6 text-left">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Specialist / alumni
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            Listing
          </div>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Marketplace presence and simple ops dashboard; connect requests surface on counselor home.
          </p>
          <Link href="/auth/signup?role=specialist" className="btn-secondary mt-4 w-full text-center text-sm">
            Create listing
          </Link>
        </div>
      </div>
    </section>
  );
}
