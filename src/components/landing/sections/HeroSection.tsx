import Link from "next/link";
import { MockDeviceFrame } from "@/components/landing/MockDeviceFrame";

export function HeroSection() {
  return (
    <section className="relative pt-6 pb-14 sm:pt-10 sm:pb-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,1.05fr)] lg:gap-14">
        <div className="max-w-xl">
          <p
            className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
          >
            AI for serious college applicants
          </p>
          <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08]" style={{ color: "var(--text-primary)" }}>
            The operating system for ambitious students building standout applications.
          </h1>
          <p className="mt-5 text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-secondary)" }}>
            One workspace for your profile, essays, activities, college list, competitions, and projects—with structured AI feedback and planning,
            not scattered docs and one-off chatbots.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/auth/signup?role=student" className="btn-primary px-5 py-2.5 text-sm font-medium">
              Start as a student
            </Link>
            <Link href="/auth/signup?role=counselor" className="btn-secondary px-5 py-2.5 text-sm font-medium">
              Counselor access
            </Link>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            For high school students and the counselors who guide them. No credit card for the student beta path.
          </p>
        </div>

        <div className="relative lg:-mr-4">
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-90 blur-2xl sm:-inset-8"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 70% 20%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 50% at 20% 80%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 50%)",
            }}
          />
          <MockDeviceFrame title="dashboard.astra.app — Admissions command center">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Readiness snapshot
                </span>
                <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: "color-mix(in oklab, var(--accent) 16%, transparent)", color: "var(--accent-strong)" }}>
                  Live workspace
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Essays", v: "72%" },
                  { label: "Activities", v: "64%" },
                  { label: "Plan", v: "58%" },
                ].map((x) => (
                  <div key={x.label} className="panel-muted rounded-lg px-2.5 py-2">
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {x.label}
                    </div>
                    <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {x.v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-muted rounded-lg p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Next up
                </div>
                <div className="mt-1 text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                  Shortlist 2 reach schools · Finish supplemental draft · Log competition result in Activities.
                </div>
              </div>
              <div className="flex gap-2 rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--border-soft)", background: "var(--bg-app)" }}>
                <div className="h-8 w-8 shrink-0 rounded-md" style={{ background: "color-mix(in oklab, var(--accent) 14%, var(--bg-muted))" }} />
                <div className="min-w-0">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Essay evaluation
                  </div>
                  <div className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Structured feedback on voice, specificity, and fit—grounded in your draft text.
                  </div>
                </div>
              </div>
            </div>
          </MockDeviceFrame>
        </div>
      </div>
    </section>
  );
}
