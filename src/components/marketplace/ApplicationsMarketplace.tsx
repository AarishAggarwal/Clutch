"use client";

import * as React from "react";
import ApplicationDetailModal from "@/components/marketplace/ApplicationDetailModal";
import ApplicationListingCard from "@/components/marketplace/ApplicationListingCard";
import type { MarketplaceApplicationCard } from "@/lib/marketplacePayments";

export default function ApplicationsMarketplace() {
  const [applications, setApplications] = React.useState<MarketplaceApplicationCard[]>([]);
  const [unlockedIds, setUnlockedIds] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<MarketplaceApplicationCard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marketplace/applications");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { applications: MarketplaceApplicationCard[] };
      const apps = data.applications ?? [];
      setApplications(apps);

      const statuses = await Promise.all(
        apps.map(async (app) => {
          const s = await fetch(`/api/marketplace/unlock-status?applicationId=${app.id}`);
          if (!s.ok) return { id: app.id, unlocked: false };
          const j = (await s.json()) as { unlocked: boolean };
          return { id: app.id, unlocked: j.unlocked };
        }),
      );
      setUnlockedIds(new Set(statuses.filter((s) => s.unlocked).map((s) => s.id)));
      setLoading(false);
    })();
  }, []);

  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Admitted applications</p>
        <p className="mt-1 text-sm text-text-secondary">
          Buy and view past admitted students&apos; applications. Preview a few lines free — unlock the full PDF for ₹600.
        </p>
      </div>

      {loading ? (
        <p className="section-meta">Loading applications…</p>
      ) : applications.length === 0 ? (
        <div className="empty-state">No applications listed yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationListingCard key={app.id} application={app} onClick={() => setSelected(app)} />
          ))}
        </div>
      )}

      {selected ? (
        <ApplicationDetailModal
          application={selected}
          unlocked={unlockedIds.has(selected.id)}
          onClose={() => setSelected(null)}
          onUnlocked={(id) => setUnlockedIds((prev) => new Set(prev).add(id))}
        />
      ) : null}
    </section>
  );
}
