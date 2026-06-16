import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/prisma";
import { authOptions } from "@/lib/auth";
import HomeShortlistSection from "@/components/home/HomeShortlistSection";

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreToRingOffset(score: number, radius: number) {
  const circumference = 2 * Math.PI * radius;
  return circumference - (score / 100) * circumference;
}

function ProgressBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-text-secondary">{label}</span>
        <span className="font-bold text-text-primary">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }
  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] || "there";

  const [essayCount, activityCount, profile, recentEssays, notifications] = await Promise.all([
    prisma.essay.count({ where: { userId } }),
    prisma.activity.count({ where: { userId } }),
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.essay.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const essayScore = clamp(Math.round((essayCount / 8) * 100), 0, 100);
  const activityScore = clamp(Math.round((activityCount / 10) * 100), 0, 100);
  const gpaScore = profile?.gpa != null ? clamp(Math.round((profile.gpa / 4) * 100), 0, 100) : 0;
  const testBase =
    profile?.sat != null
      ? Math.round((profile.sat / 1600) * 100)
      : profile?.act != null
        ? Math.round((profile.act / 36) * 100)
        : 0;
  const gradesScore = clamp(Math.round(gpaScore * 0.7 + testBase * 0.3), 0, 100);
  const overallProgress = Math.round((essayScore + activityScore + gradesScore) / 3);
  const pendingEssays = recentEssays.filter((e) => e.status !== "submitted" && e.status !== "approved").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap space-y-8">
        <div>
          <h1 className="display-title">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {pendingEssays > 0
              ? `You have ${pendingEssays} essay${pendingEssays === 1 ? "" : "s"} in progress.`
              : "Your application workspace is up to date."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="clutch-card">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Readiness</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-data-mono text-[32px] text-primary-container">{overallProgress}</span>
              <span className="text-xs text-text-muted">%</span>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full bg-primary-container" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          <div className="clutch-card">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Essays saved</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-data-mono text-[32px] text-safety-green">{essayCount}</span>
              <span className="text-xs text-text-muted">drafts</span>
            </div>
          </div>
          <div className="clutch-card">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Activities</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-data-mono text-[32px] text-match-amber">{activityCount}</span>
              <span className="text-xs text-text-muted">entries</span>
            </div>
          </div>
          <div className="clutch-card">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Essays pending</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-data-mono text-[32px] text-reach-rose">{pendingEssays}</span>
              <span className="text-xs text-text-muted">in progress</span>
            </div>
          </div>
        </div>

        {notifications.length ? (
          <section className="panel p-5">
            <div className="mb-3 text-sm font-semibold text-text-primary">Recent notifications</div>
            <div className="space-y-2">
              {notifications.map((n) => (
                <Link key={n.id} href={n.link || "#"} className="block rounded-lg border border-border-subtle px-3 py-2 hover:bg-surface">
                  <div className="text-sm font-medium text-text-primary">{n.title}</div>
                  <div className="text-xs text-text-secondary">{n.body}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <section className="panel lg:col-span-3 p-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Application readiness</h2>
              <Link href="/profile" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                View details
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </Link>
            </div>
            <div className="flex flex-col items-center gap-12 md:flex-row">
              <div className="relative flex h-[140px] w-[140px] items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                  <circle
                    className="text-primary-container transition-all duration-700"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="42"
                    stroke="currentColor"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={scoreToRingOffset(overallProgress, 42)}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-data-mono text-[32px] font-bold text-text-primary">{overallProgress}</span>
                  <span className="text-[10px] font-bold uppercase text-text-muted">Score</span>
                </div>
              </div>
              <div className="w-full flex-1 space-y-4">
                <ProgressBar label="Essays" score={essayScore} color="bg-match-amber" />
                <ProgressBar label="Activities" score={activityScore} color="bg-safety-green" />
                <ProgressBar label="Grades & tests" score={gradesScore} color="bg-primary-container" />
              </div>
            </div>
          </section>

          <section className="panel lg:col-span-2 p-6">
            <h2 className="mb-6 text-lg font-semibold text-text-primary">Quick actions</h2>
            <div className="space-y-3">
              <Link href="/essays" className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3 text-sm font-medium transition hover:border-primary hover:-translate-y-px">
                <span className="material-symbols-outlined text-primary">description</span>
                Start or edit an essay
              </Link>
              <Link href="/universities" className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3 text-sm font-medium transition hover:border-primary hover:-translate-y-px">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                Explore universities
              </Link>
              <Link href="/application-preview" className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3 text-sm font-medium transition hover:border-primary hover:-translate-y-px">
                <span className="material-symbols-outlined text-primary">preview</span>
                Application preview
              </Link>
            </div>
          </section>
        </div>

        <HomeShortlistSection />

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle p-6">
            <h2 className="text-lg font-semibold text-text-primary">Current essay status</h2>
            <Link href="/essays" className="btn-primary flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg">add</span>
              New essay
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Type</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-text-muted">Words</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentEssays.map((e) => (
                  <tr key={e.id} className="transition hover:bg-surface">
                    <td className="px-6 py-4 font-medium text-text-primary">{e.title}</td>
                    <td className="px-6 py-4 text-text-secondary">{e.essayType}</td>
                    <td className="px-6 py-4 text-center font-data-mono text-text-primary">{e.wordCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          "inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                          e.status === "submitted" || e.status === "approved"
                            ? "bg-safety-green/10 text-safety-green"
                            : e.status === "in_review"
                              ? "bg-match-amber/10 text-match-amber"
                              : "bg-reach-rose/10 text-reach-rose",
                        ].join(" ")}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">{new Date(e.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!recentEssays.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      No essays yet.{" "}
                      <Link href="/essays" className="font-medium text-primary underline">
                        Create your first draft
                      </Link>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
