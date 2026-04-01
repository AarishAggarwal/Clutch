import { MockDeviceFrame } from "@/components/landing/MockDeviceFrame";

export function ProductPreviewSection() {
  return (
    <section id="product" className="scroll-mt-24 border-t py-16 sm:py-20" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Everything you used to juggle—now one product
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Spreadsheets for college lists, random sites for contests, Google Docs for essays, and ad-hoc advice in threads. Astra pulls strategy and execution into a single,
          structured workspace built around how admissions actually works.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-2">
        <MockDeviceFrame title="Essays — AI evaluation">
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-xs leading-relaxed" style={{ borderColor: "var(--border-soft)", color: "var(--text-secondary)" }}>
              Draft excerpt: “…I realized leadership isn’t about titles, it’s about staying when… ”
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { k: "Clarity", s: "Strong" },
                { k: "Specificity", s: "Tighten" },
                { k: "Authenticity", s: "Strong" },
                { k: "Fit signal", s: "Add example" },
              ].map((row) => (
                <div key={row.k} className="panel-muted flex items-center justify-between rounded-lg px-2.5 py-2 text-xs">
                  <span style={{ color: "var(--text-muted)" }}>{row.k}</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {row.s}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Illustration: evaluation panels align with how reviewers read—structure and evidence, not vague praise.
            </p>
          </div>
        </MockDeviceFrame>

        <MockDeviceFrame title="Project ideator — chat session">
          <div className="space-y-2.5">
            <div className="rounded-lg rounded-tl-sm border px-3 py-2 text-xs" style={{ borderColor: "var(--border-soft)", background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
              You: CS + biology interest, want a measurable community impact project in 4 months.
            </div>
            <div
              className="rounded-lg rounded-tr-sm border px-3 py-2 text-xs leading-relaxed"
              style={{ borderColor: "var(--border-soft)", background: "color-mix(in oklab, var(--accent) 8%, var(--bg-elevated))", color: "var(--text-secondary)" }}
            >
              Ideator: Three directions: clinic wait-time SMS triage, arbovirus data literacy workshop, low-cost microscope citizen science kit—each with milestones and
              evidence hooks.
            </div>
            <div className="flex gap-2 pt-1">
              <span className="rounded-md border px-2 py-1 text-[10px]" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
                Save idea
              </span>
              <span className="rounded-md border px-2 py-1 text-[10px]" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
                Open tracker
              </span>
            </div>
          </div>
        </MockDeviceFrame>

        <MockDeviceFrame title="College discovery — filters + shortlist">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {["Public", "California", "Net price cap", "Admit %"].map((t) => (
                <span key={t} className="rounded-md border px-2 py-1 text-[10px]" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="panel-muted flex items-start justify-between gap-2 rounded-lg p-3">
              <div>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Example University
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Net price · Admit rate · Deadlines
                </div>
              </div>
              <span className="text-sm" style={{ color: "var(--accent)" }} aria-hidden>
                ♥
              </span>
            </div>
          </div>
        </MockDeviceFrame>

        <MockDeviceFrame title="Activities — competitions">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                Competition finder
              </span>
              <span style={{ color: "var(--text-muted)" }}>600+ indexed</span>
            </div>
            <div className="panel-muted rounded-lg px-3 py-2">
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                National Science Bowl
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                Science · Team · US — save, open details, track deadlines on the official site
              </div>
            </div>
            <div className="panel-muted rounded-lg px-3 py-2">
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Your activities list
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                Common App–style fields, hours, honors in Locker
              </div>
            </div>
          </div>
        </MockDeviceFrame>
      </div>
    </section>
  );
}
