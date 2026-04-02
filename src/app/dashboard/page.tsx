import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { authOptions } from "@/lib/auth";
import HomeClock from "@/components/HomeClock";
import HomeShortlistSection from "@/components/home/HomeShortlistSection";

/** Always read fresh counts from the database (avoid static prerender at build time). */
export const dynamic = "force-dynamic";

function scoreToRingOffset(score: number, radius: number) {
  const circumference = 2 * Math.PI * radius;
  return circumference - (score / 100) * circumference;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }
  const userId = session.user.id;

  const [essayCount, activityCount, profile] = await Promise.all([
    prisma.essay.count({ where: { userId } }),
    prisma.activity.count({ where: { userId } }),
    prisma.studentProfile.findUnique({ where: { userId } }),
  ]);

  const essayScore = clamp(Math.round((essayCount / 8) * 100), 0, 100);
  const activityScore = clamp(Math.round((activityCount / 10) * 100), 0, 100);
  const gpaScore = profile?.gpa != null ? clamp(Math.round((profile.gpa / 4) * 100), 0, 100) : 0;
  const testBase = profile?.sat != null ? Math.round((profile.sat / 1600) * 100) : profile?.act != null ? Math.round((profile.act / 36) * 100) : 0;
  const gradesScore = clamp(Math.round(gpaScore * 0.7 + testBase * 0.3), 0, 100);
  const overallProgress = Math.round((essayScore + activityScore + gradesScore) / 3);

  const rings = [{ radius: 104, width: 14, color: "stroke-teal-500", score: overallProgress }];

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 grid items-end gap-4 sm:grid-cols-3">
          <div className="sm:col-start-1">
            <h1 className="page-title">Admissions Command Center</h1>
            <p className="page-subtitle">Track readiness across writing, activities, and academics with one clear operating view.</p>
          </div>
          <div className="sm:col-start-2 sm:justify-self-center">
            <HomeClock />
          </div>
          <div className="sm:col-start-3 sm:justify-self-end">
            <div className="panel-muted px-4 py-3 text-right">
              <div className="kpi-label">Readiness</div>
              <div className="kpi-value">{overallProgress}%</div>
              <div className="section-meta">overall application completion</div>
            </div>
          </div>
        </div>

        <section className="panel relative p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              {[{ title: "Essays", score: essayScore, note: `${essayCount} saved drafts` }].map((d) => (
                <div key={d.title} className="panel-muted p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {d.title}
                    </div>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {d.score}
                    </div>
                  </div>
                  <div className="section-meta mt-1">{d.note}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <div
                className="relative h-[320px] w-[320px] rounded-full shadow-[0_12px_40px_-24px_rgba(16,24,40,0.18)] dark:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)]"
                style={{ background: "var(--bg-elevated)" }}
              >
                <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
                  {rings.map((r) => (
                    <g key={r.radius}>
                      <circle
                        cx="130"
                        cy="130"
                        r={r.radius}
                        fill="none"
                        stroke="var(--border-soft)"
                        strokeWidth={r.width}
                      />
                      <circle
                        cx="130"
                        cy="130"
                        r={r.radius}
                        fill="none"
                        className={r.color}
                        strokeWidth={r.width}
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * r.radius}
                        strokeDashoffset={scoreToRingOffset(r.score, r.radius)}
                      />
                    </g>
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="kpi-label tracking-[0.18em]">Application Progress</div>
                  <div className="mt-2 text-6xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {overallProgress}
                  </div>
                  <div className="badge-accent mt-1 text-sm">Overall completion</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title: "Activities", score: activityScore, note: `${activityCount} activity entries` },
                {
                  title: "Grades",
                  score: gradesScore,
                  note:
                    profile?.gpa != null
                      ? `GPA ${profile.gpa.toFixed(2)}${profile?.sat ? ` · SAT ${profile.sat}` : profile?.act ? ` · ACT ${profile.act}` : ""}`
                      : "Add GPA/test scores in Profile",
                },
              ].map((d) => (
                <div key={d.title} className="panel-muted p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {d.title}
                    </div>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {d.score}
                    </div>
                  </div>
                  <div className="section-meta mt-1">{d.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HomeShortlistSection />

        <div className="panel mt-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-heading">Progress summary</div>
              <div className="section-meta mt-0.5 max-w-xl">
                Progress updates as you add essays, activities, and profile grades.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-teal">Essays · {essayScore}%</span>
              <span className="chip chip-amber">Activities · {activityScore}%</span>
              <span className="chip chip-sky">Grades · {gradesScore}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
