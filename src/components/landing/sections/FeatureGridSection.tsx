function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
      style={{
        borderColor: "var(--border-soft)",
        background: "color-mix(in oklab, var(--accent) 10%, var(--bg-muted))",
        color: "var(--accent-strong)",
      }}
    >
      {children}
    </div>
  );
}

const features = [
  {
    title: "AI essay evaluation",
    desc: "Paste a draft and get structured feedback aligned with how admissions readers evaluate clarity, specificity, and narrative strength.",
    value: "Improve drafts with concrete direction—not a generic pep talk.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Project ideator",
    desc: "A dedicated chatbot for high-school projects—research, apps, fairs, startups—with filters and saved ideas you can turn into a plan.",
    value: "Go from vague interest to scoped, credibile project concepts.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "College explorer",
    desc: "Search and filter real institutional data, build a shortlist, and jump from a school to supplemental essay prompts when you’re ready to write.",
    value: "One list for discovery, comparison, and next-step writing.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Competition finder",
    desc: "Browse hundreds of high school competitions by type, interest, and region; save targets and open official rules on the organizer site.",
    value: "Stop hunting random lists; search what fits your profile.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    title: "Activities & awards workspace",
    desc: "Common App–style activity entries, project workspace, competitions tab, and a locker for certificates and honors—all organized around your narrative.",
    value: "Evidence and story live in one place, not scattered files.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    title: "Admissions dashboard",
    desc: "A command-center view of progress across essays, activities, and planning so you always know what to do next.",
    value: "Reduce anxiety with a single source of truth for progress.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Profile intelligence",
    desc: "Structured student profile drives personalization—from essay context to counselor visibility—so guidance matches your school, goals, and interests.",
    value: "Fewer generic tips; more relevance to your actual record.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Counselor mode",
    desc: "Look up students by ID, see essays, activities, grades context, locker files, and marketplace connect requests in one counselor home.",
    value: "Built for oversight without forcing counselors into ten tabs.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export function FeatureGridSection() {
  return (
    <section id="features" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Built around how applications are actually assembled
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Eight pillars that map to real work: writing, listing, exploring, proving impact, and staying on track—not a single bolt-on chat window.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article key={f.title} className="panel p-5 transition hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]">
            <FeatureIcon>{f.icon}</FeatureIcon>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {f.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {f.desc}
            </p>
            <p className="mt-3 border-t pt-3 text-[11px] font-medium leading-snug" style={{ borderColor: "var(--border-soft)", color: "var(--accent-strong)" }}>
              {f.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
