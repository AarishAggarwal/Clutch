"use client";

import * as React from "react";
import ApplicationsMarketplace from "@/components/marketplace/ApplicationsMarketplace";

type SpecialistCard = {
  id: string;
  fullName: string;
  roleType: "specialist" | "alumni";
  headline: string;
  bio: string;
  expertise: string;
  priceDisplay: string;
};

type MarketplaceTab = "all" | "applications" | "specialists";

const TAB_OPTIONS: { value: MarketplaceTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applications", label: "Applications" },
  { value: "specialists", label: "Specialists & Alumni" },
];

export default function MarketplacePage() {
  const [tab, setTab] = React.useState<MarketplaceTab>("all");
  const [cards, setCards] = React.useState<SpecialistCard[]>([]);
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/specialists");
      if (!res.ok) return;
      const data = (await res.json()) as { specialists: SpecialistCard[] };
      setCards(data.specialists ?? []);
    })();
  }, []);

  async function connect(card: SpecialistCard) {
    setStatus(null);
    const res = await fetch("/api/marketplace/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialistId: card.id, specialistName: card.fullName }),
    });
    if (!res.ok) {
      setStatus("Could not send request.");
      return;
    }
    setStatus(`Connection request sent to ${card.fullName}. Your counselor can now view this request.`);
  }

  const showApplications = tab === "all" || tab === "applications";
  const showSpecialists = tab === "all" || tab === "specialists";

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Marketplace</h1>
            <p className="page-subtitle">
              Browse admitted student applications or connect with alumni and specialists.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label className="field-label">Browse</label>
            <select
              className="input-base min-w-[12rem]"
              value={tab}
              onChange={(e) => setTab(e.target.value as MarketplaceTab)}
            >
              {TAB_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showApplications ? (
          <section className="panel mb-8 p-6">
            <ApplicationsMarketplace />
          </section>
        ) : null}

        {showSpecialists ? (
          <section className="panel p-6">
            <div className="section-heading">Alumni + Specialist Directory</div>
            {status ? <div className="mt-2 text-sm text-text-secondary">{status}</div> : null}
            {cards.length === 0 ? (
              <div className="empty-state mt-4">No specialists registered yet.</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-xl border border-border-subtle bg-elevated p-4"
                  >
                    <div className="text-xs uppercase tracking-wide text-text-muted">
                      {c.roleType === "alumni" ? "Alumni" : "Specialist"}
                    </div>
                    <div className="mt-1 text-base font-semibold text-text-primary">{c.fullName}</div>
                    <div className="mt-1 text-sm text-text-secondary">{c.headline}</div>
                    <div className="mt-2 text-sm text-text-secondary">{c.bio}</div>
                    <div className="mt-2 text-xs text-text-muted">Expertise: {c.expertise}</div>
                    <div className="mt-1 text-xs text-text-muted">Ad price: {c.priceDisplay}</div>
                    <button className="btn-primary mt-3 px-2.5 py-1.5 text-xs" onClick={() => void connect(c)}>
                      Connect
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
