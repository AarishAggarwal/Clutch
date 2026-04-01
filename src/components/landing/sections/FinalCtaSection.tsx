import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="border-t py-16 sm:py-20" style={{ borderColor: "var(--border-soft)" }}>
      <div className="panel mx-auto max-w-4xl overflow-hidden p-8 text-center sm:p-12">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          Ship a stronger application—with the same record you already have
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Astra helps you organize proof, sharpen essays, pick opportunities, and execute on a timeline. Start with your profile; the workspace builds from there.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/auth/signup?role=student" className="btn-primary px-6 py-2.5 text-sm font-medium">
            Create student workspace
          </Link>
          <Link href="/auth/login?role=student" className="btn-secondary px-6 py-2.5 text-sm font-medium">
            Log in
          </Link>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Counselors and specialists: use role-specific signup to route to the right home.
        </p>
      </div>
    </section>
  );
}
