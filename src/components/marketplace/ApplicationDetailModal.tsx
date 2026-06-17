"use client";

import * as React from "react";
import MaterialIcon from "@/components/shell/MaterialIcon";
import {
  loadRazorpayScript,
  type MarketplaceApplicationCard,
  type RazorpaySuccessResponse,
} from "@/lib/marketplacePayments";

type Props = {
  application: MarketplaceApplicationCard;
  unlocked: boolean;
  onClose: () => void;
  onUnlocked: (applicationId: string) => void;
};

export default function ApplicationDetailModal({ application, unlocked, onClose, onUnlocked }: Props) {
  const [paying, setPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(unlocked);

  React.useEffect(() => {
    setIsUnlocked(unlocked);
  }, [unlocked]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function openFullPdf() {
    window.open(`/api/marketplace/applications/${application.id}/pdf`, "_blank", "noopener,noreferrer");
  }

  async function handlePurchase() {
    setPaying(true);
    setError(null);
    try {
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");

      const orderRes = await fetch("/api/marketplace/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const orderData = (await orderRes.json()) as {
        order_id?: string;
        amount?: number;
        currency?: string;
        key_id?: string;
        error?: string;
      };
      if (!orderRes.ok || !orderData.order_id || !orderData.key_id) {
        throw new Error(orderData.error || "Could not start checkout.");
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Clutch",
          description: `${application.universityFull} admitted application`,
          order_id: orderData.order_id,
          theme: { color: "#4f46e5" },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const verifyRes = await fetch("/api/marketplace/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...response,
                  applicationId: application.id,
                }),
              });
              const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }
              setIsUnlocked(true);
              onUnlocked(application.id);
              resolve();
            } catch (e: unknown) {
              reject(e);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });
        rzp.on("payment.failed", (r) => {
          reject(new Error(r.error?.description || "Payment failed."));
        });
        rzp.open();
      });

      await openFullPdf();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment could not be completed.";
      if (msg !== "Payment cancelled.") setError(msg);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border-subtle bg-surface-container-low px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Buy and view past admitted students application
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-text-primary">
            {application.studentName}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {application.admissionYear} · {application.universityFull}
          </p>
          <p className="mt-1 text-xs text-text-muted">{application.program}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Preview</p>
          <div className="relative mt-2 rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
            <div className="space-y-2 text-sm leading-relaxed text-text-secondary">
              {application.previewLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {!isUnlocked ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/90 to-transparent" />
            ) : null}
          </div>
          {!isUnlocked ? (
            <p className="mt-3 text-xs text-text-muted">
              Full 12-page Common App export is locked. Unlock to view and download the complete PDF.
            </p>
          ) : null}
          {error ? <p className="alert-error mt-3 rounded-lg px-3 py-2 text-sm">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-4">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
          {isUnlocked ? (
            <button type="button" onClick={() => void openFullPdf()} className="btn-primary text-sm">
              <MaterialIcon name="picture_as_pdf" className="mr-1 !text-base" />
              View full PDF
            </button>
          ) : (
            <button type="button" onClick={() => void handlePurchase()} disabled={paying} className="btn-primary text-sm">
              {paying ? "Processing…" : `Buy for ₹${application.priceInr}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
