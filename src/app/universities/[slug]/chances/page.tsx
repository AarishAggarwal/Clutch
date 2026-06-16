import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/prisma";
import { getUniversityBySlug } from "@/server/universities/universityService";

function clamp(v: number) {
  return Math.max(1, Math.min(99, Math.round(v)));
}

export default async function ChancesPage({ params }: { params: { slug: string } }) {
  const uni = await getUniversityBySlug(params.slug);
  if (!uni) return <div className="page-wrap py-8">University not found.</div>;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const profile = userId ? await prisma.studentProfile.findUnique({ where: { userId } }) : null;
  const [essayCount, activityCount] = userId
    ? await Promise.all([
        prisma.essay.count({ where: { userId } }),
        prisma.activity.count({ where: { userId } }),
      ])
    : [0, 0];

  const admitRate = uni.acceptanceRate != null ? uni.acceptanceRate * 100 : 35;
  const gpaBoost = profile?.gpa != null ? (profile.gpa - 3) * 8 : -4;
  const test = profile?.sat != null ? profile.sat / 16 : profile?.act != null ? (profile.act / 36) * 100 : 55;
  const testBoost = (test - 60) * 0.25;
  const completionBoost = Math.min(essayCount, 8) * 1.8 + Math.min(activityCount, 10) * 1.2;
  const chance = clamp(admitRate + gpaBoost + testBoost + completionBoost - 10);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap max-w-3xl space-y-4">
        <Link href={`/universities/${uni.slug}`} className="btn-ghost text-sm">← Back to university</Link>
        <h1 className="page-title">{uni.name} — Fun chance estimate</h1>
        <p className="page-subtitle">
          This score is just for fun, not an admissions confirmation. Fill your full application for a more realistic estimate.
        </p>
        <div className="panel p-5">
          <div className="text-sm text-text-secondary">Estimated chance</div>
          <div className="mt-1 font-data-mono text-5xl text-primary-container">{chance}%</div>
          <div className="mt-4 space-y-1 text-sm text-text-secondary">
            <div>Acceptance-rate baseline: {admitRate.toFixed(1)}%</div>
            <div>Profile used: GPA {profile?.gpa ?? "missing"}, SAT {profile?.sat ?? "missing"}, ACT {profile?.act ?? "missing"}</div>
            <div>Portfolio used: {essayCount} essays, {activityCount} activities</div>
          </div>
        </div>
        <div className="panel p-4 text-sm text-text-secondary">
          Missing fields are treated as not completed yet. Complete your profile, essays, and activities to improve this estimate.
        </div>
      </div>
    </div>
  );
}
