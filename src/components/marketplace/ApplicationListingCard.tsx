"use client";

import type { MarketplaceApplicationCard } from "@/lib/marketplacePayments";

type Props = {
  application: MarketplaceApplicationCard;
  onClick: () => void;
};

export default function ApplicationListingCard({ application, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[8.5rem] w-full flex-col justify-between rounded-xl border border-border-subtle bg-surface-container-lowest p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
    >
      <div>
        <div className="inline-flex rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {application.universityShort}
        </div>
        <p className="mt-3 text-base font-semibold text-text-primary">{application.studentName}</p>
        <p className="mt-0.5 text-xs text-text-muted">{application.admissionYear} admit</p>
      </div>
      <p className="mt-3 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        View preview · ₹{application.priceInr}
      </p>
    </button>
  );
}
