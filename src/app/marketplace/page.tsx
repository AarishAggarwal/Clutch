"use client";

import * as React from "react";

type SpecialistCard = {
  id: string;
  fullName: string;
  roleType: "specialist" | "alumni";
  headline: string;
  bio: string;
  expertise: string;
  priceDisplay: string;
};

export default function MarketplacePage() {
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <h1 className="page-title">Marketplace</h1>
          <p className="page-subtitle">
            Discover registered alumni and specialists, review their details, and send connect requests.
          </p>
        </div>

        <section className="panel p-6">
          <div className="section-heading">Alumni + Specialist Directory</div>
          {status ? <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{status}</div> : null}
          {cards.length === 0 ? (
            <div className="empty-state mt-4">No specialists registered yet.</div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <article key={c.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-soft)", background: "var(--bg-elevated)" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {c.roleType === "alumni" ? "Alumni" : "Specialist"}
                  </div>
                  <div className="mt-1 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.fullName}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{c.headline}</div>
                  <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{c.bio}</div>
                  <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Expertise: {c.expertise}</div>
                  <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Ad price: {c.priceDisplay}</div>
                  <button className="btn-primary mt-3 text-xs px-2.5 py-1.5" onClick={() => void connect(c)}>
                    Connect
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

