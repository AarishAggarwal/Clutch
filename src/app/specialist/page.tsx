"use client";

import * as React from "react";

type ConnectRequest = {
  requestId: string;
  specialistId: string;
  specialistName: string;
  studentId: string;
  studentName: string;
  createdAt: string;
};

type SpecialistProfile = {
  id: string;
  fullName: string;
  roleType: "specialist" | "alumni";
  headline: string;
  bio: string;
  expertise: string;
  priceDisplay: string;
};

const PROFILE_KEY = "activeSpecialist:v1";

export default function SpecialistHomePage() {
  const [profile, setProfile] = React.useState<SpecialistProfile | null>(null);
  const [requests, setRequests] = React.useState<ConnectRequest[]>([]);
  const [price, setPrice] = React.useState("$79 per featured placement");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as SpecialistProfile);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marketplace/connect");
      if (!res.ok) return;
      const data = (await res.json()) as { requests: ConnectRequest[] };
      if (!profile) {
        setRequests(data.requests ?? []);
        return;
      }
      setRequests((data.requests ?? []).filter((r) => r.specialistId === profile.id));
    })();
  }, [profile]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page-wrap">
        <div className="mb-6">
          <h1 className="page-title">Specialist / Alumni Home</h1>
          <p className="page-subtitle">Simple control center for requests and advertisement pricing.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="panel p-5">
            <div className="section-meta">Students who want to meet you</div>
            <div className="mt-2 text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {requests.length}
            </div>
          </section>

          <section className="panel p-5">
            <div className="section-meta">Advertisement pricing</div>
            <input className="input-base mt-3" value={price} onChange={(e) => setPrice(e.target.value)} />
            <div className="section-meta mt-2">Set the price text displayed for your listing.</div>
          </section>
        </div>
      </div>
    </div>
  );
}

