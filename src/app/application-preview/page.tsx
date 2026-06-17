"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommonAppPreviewDocument, {
  type PreviewActivity,
  type PreviewEssay,
} from "@/components/application-preview/CommonAppPreviewDocument";
import type { PreviewProfile } from "@/lib/applicationPreviewFormat";

export default function ApplicationPreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);
  const [profile, setProfile] = React.useState<PreviewProfile | null>(null);
  const [studentId, setStudentId] = React.useState<string | null>(null);
  const [activities, setActivities] = React.useState<PreviewActivity[]>([]);
  const [essays, setEssays] = React.useState<PreviewEssay[]>([]);

  React.useEffect(() => {
    void (async () => {
      try {
        const [prRes, actRes, esRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/activities"),
          fetch("/api/essays"),
        ]);
        if (prRes.status === 401) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        const pr = (await prRes.json()) as { profile: PreviewProfile; studentId?: string };
        const act = (await actRes.json()) as { activities: PreviewActivity[] };
        const es = (await esRes.json()) as { essays: PreviewEssay[] };
        setProfile(pr.profile);
        setStudentId(pr.studentId ?? null);
        setActivities(act.activities ?? []);
        setEssays(es.essays ?? []);
      } catch {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="section-meta">Loading preview…</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="page-wrap py-12 text-center">
        <p className="text-sm text-text-secondary">Sign in to view your application preview.</p>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() => router.push("/auth/login?callbackUrl=/application-preview")}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="ca-preview-shell h-full overflow-y-auto">
      <div className="ca-preview-toolbar ca-preview-no-print">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Application preview</p>
          <p className="mt-0.5 text-sm text-text-secondary">
            Common App–style snapshot using your profile, activities, and essays only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary text-sm">
            Print / Save PDF
          </button>
          <Link href="/profile" className="btn-secondary text-sm">
            Edit profile
          </Link>
          <Link href="/activities" className="btn-secondary text-sm">
            Activities
          </Link>
          <Link href="/essays" className="btn-secondary text-sm">
            Essays
          </Link>
        </div>
      </div>

      <CommonAppPreviewDocument
        profile={profile}
        studentId={studentId}
        activities={activities}
        essays={essays}
      />
    </div>
  );
}
